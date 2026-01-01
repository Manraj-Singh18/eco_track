import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export default function Tasks() {

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(){
    // Load pending complaints
    const cSnap = await getDocs(query(collection(db,"complaints"), where("status","==","pending")));
    const complaintsData = cSnap.docs.map(d=>({id:d.id,...d.data()}));
    setComplaints(complaintsData);

    // Load workers
    const wSnap = await getDocs(collection(db,"workers"));
    setWorkers(
      wSnap.docs.map(d=>({
        firestoreId: d.id,   // Firestore document ID
        ...d.data()          // contains id, name, phone
      }))
    );

    // Build Suggested Tasks
    const tasks = buildTasks(complaintsData);
    setSuggestedTasks(tasks);

    setLoading(false);
  }

  // ---------------- Grouping Algorithm ----------------

  function distance(a,b){
    const R = 6371000;
    const dLat = (b.latitude - a.latitude) * Math.PI/180;
    const dLng = (b.longitude - a.longitude) * Math.PI/180;
    const lat1 = a.latitude * Math.PI/180;
    const lat2 = b.latitude * Math.PI/180;

    const h = Math.sin(dLat/2)**2 +
      Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;

    return R * 2 * Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
  }

  function urgencyScore(hours){
    if(hours > 48) return 5;
    if(hours > 24) return 3;
    if(hours > 6)  return 1;
    return 0;
  }

  function buildTasks(list){
    if(!list.length) return [];

    // Group by issue type
    const issueGroups = {};
    list.forEach(c=>{
      if(!issueGroups[c.issue]) issueGroups[c.issue] = [];
      issueGroups[c.issue].push(c);
    });

    let tasks = [];

    Object.keys(issueGroups).forEach(issue => {
      const issueList = issueGroups[issue];

      const visited = new Set();

      for(let i=0;i<issueList.length;i++){
        if(visited.has(i)) continue;

        const cluster=[issueList[i]];
        visited.add(i);

        for(let j=i+1;j<issueList.length;j++){
          if(visited.has(j)) continue;

          const d = distance(issueList[i], issueList[j]);
          if(d <= 50){
            visited.add(j);
            cluster.push(issueList[j]);
          }
        }

        // Compute center lat/lng
        const lat = cluster.reduce((a,c)=>a+c.latitude,0)/cluster.length;
        const lng = cluster.reduce((a,c)=>a+c.longitude,0)/cluster.length;

        // Compute priority
        let score = cluster.length * 3;

        cluster.forEach(c=>{
          const hours = (Date.now() - c.createdAt.seconds*1000)/3600000;
          score += urgencyScore(hours);
        });

        tasks.push({
          issueType: issue,
          complaints: cluster,
          centerLat: lat,
          centerLng: lng,
          priorityScore: score
        });

      }
    });

    // Sort highest priority first
    tasks.sort((a,b)=>b.priorityScore - a.priorityScore);
    return tasks;
  }

  // ---------------- Assign Worker + Create Task ----------------

  async function assignTask(task, workerId){

    if(workerId === "Select") return;

    await addDoc(collection(db,"tasks"),{
      issueType: task.issueType,
      complaints: task.complaints.map(c=>c.id),
      centerLat: task.centerLat,
      centerLng: task.centerLng,
      priorityScore: task.priorityScore,
      assignedWorkerId: workerId,     // Stores "w3"
      status: "ongoing",
      createdAt: new Date()
    });

    // Set complaints to ongoing
    for(const c of task.complaints){
      await updateDoc(doc(db,"complaints",c.id),{status:"ongoing"});
    }

    alert("Task Assigned Successfully!");

    loadData();
  }

  return (
    <div>
      <h2 className="text-4xl font-[500] text-[#244034] pb-5">
        Suggested Tasks
      </h2>

      {loading && <p>Loading...</p>}

      {!suggestedTasks.length && !loading && (
        <p className="text-gray-500">
          No tasks required currently 🎉
        </p>
      )}

      <div className="space-y-5">
        {suggestedTasks.map((task,index)=>(
          <div key={index} className="bg-white shadow-sm rounded-xl p-5 border">

            <div className="flex justify-between items-start">

              {/* LEFT */}
              <div>
                <h3 className="text-2xl font-[500] text-[#244034]">
                  {task.issueType}
                </h3>

                <p className="text-gray-600 text-sm">
                  {task.complaints.length} complaints grouped
                </p>

                <p className="text-gray-400 text-sm">
                  Priority Score: {task.priorityScore}
                </p>
              </div>

              {/* RIGHT - Worker Select */}
              <div>
                <select
                  className="border rounded-xl px-4 py-2 text-sm"
                  onChange={(e)=>assignTask(task,e.target.value)}
                >
                  <option value="Select">
                    Select Worker
                  </option>

                  {workers.map(w=>(
                    <option key={w.firestoreId} value={w.id}>
                      {w.name} ({w.phone})
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
