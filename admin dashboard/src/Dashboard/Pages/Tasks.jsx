import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { db } from "../../firebase";

export default function Tasks() {

  /** ---------------- Recurring Engine Guard ---------------- **/
  const recurringRunning = useRef(false);

  async function runRecurringEngine() {

    if (recurringRunning.current) {
      console.log("Recurring Engine already running - blocked duplicate");
      return;
    }

    recurringRunning.current = true;

    try {
      console.log("Recurring Engine Running...");

      const snap = await getDocs(
        query(collection(db, "recurringTasks"), where("active", "==", true))
      );

      const now = Date.now();

      for (const d of snap.docs) {
        const data = d.data();
        let next = data.nextExecution;

        if (next?.toMillis) next = next.toMillis();

        if (now >= next) {
          console.log("EXECUTING recurring task:", data.title);

          const cSnap = await getDocs(collection(db, "complaints"));
          const allComplaints = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const nearby = allComplaints.filter(c =>
            distance(
              { latitude: data.location.lat, longitude: data.location.lng },
              { latitude: c.latitude, longitude: c.longitude }
            ) <= 60 && c.status === "pending"
          );

          if (nearby.length === 0) {
            console.log("No nearby complaints → skipping task creation");
          } else {
            await addDoc(collection(db, "tasks"), {
              issueType: data.issue,
              complaints: nearby.map(c => c.id),
              centerLat: data.location.lat,
              centerLng: data.location.lng,
              priorityScore: 100,
              assignedWorkerId: data.assignedWorkerId || null,
              status: "ongoing",
              createdAt: new Date()
            });

            for (const c of nearby) {
              await updateDoc(doc(db, "complaints", c.id), {
                status: "ongoing"
              });
            }

            console.log("Recurring task created with", nearby.length, "complaints");
          }

          const nextRun = now + (data.frequencyDays * 24 * 60 * 60 * 1000);

          await updateDoc(doc(db, "recurringTasks", d.id), {
            nextExecution: Timestamp.fromMillis(nextRun)
          });

          console.log("Next execution set:", new Date(nextRun));
        }
      }

    } catch (e) {
      console.error("Recurring Engine Error", e);
    } finally {
      recurringRunning.current = false;
    }
  }


  /** ---------------- UI State ---------------- **/
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadData();
    runRecurringEngine();
  }, []);


  /** ---------------- Load Data ---------------- **/
  async function loadData() {

    const cSnap = await getDocs(
      query(collection(db, "complaints"), where("status", "==", "pending"))
    );

    const complaintsData = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    setComplaints(complaintsData);

    const wSnap = await getDocs(collection(db, "workers"));
    setWorkers(
      wSnap.docs.map(d => ({
        firestoreId: d.id,
        ...d.data()
      }))
    );

    const tasks = buildTasks(complaintsData);
    setSuggestedTasks(tasks);

    setLoading(false);
  }

  /** ---------------- Distance Helper ---------------- **/
  function distance(a, b) {
    const R = 6371000;
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLng = (b.longitude - a.longitude) * Math.PI / 180;
    const lat1 = a.latitude * Math.PI / 180;
    const lat2 = b.latitude * Math.PI / 180;

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  /** ---------------- Priority System ---------------- **/
  function urgencyScore(hours) {
    if (hours > 48) return 5;
    if (hours > 24) return 3;
    if (hours > 6) return 1;
    return 0;
  }


  /** ---------------- Grouping Algorithm ---------------- **/
  function buildTasks(list){
    if(!list.length) return [];

    const ISSUE_WEIGHTS = {
      "spillage": 4,
      "dirty washroom": 3,
      "dustbin overflow": 1
    };

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

        const lat = cluster.reduce((a,c)=>a+c.latitude,0)/cluster.length;
        const lng = cluster.reduce((a,c)=>a+c.longitude,0)/cluster.length;

        // ----- PRIORITY SCORE -----
        let score = 0;

        // Issue Type Weight
        const w = ISSUE_WEIGHTS[issue?.toLowerCase().trim()] || 2;
        score += w * 10;             // base weight impact

        // Group Size Impact
        score += cluster.length * 3;

        // Urgency Impact
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

    tasks.sort((a,b)=>b.priorityScore - a.priorityScore);
    return tasks;
  }


  /** ---------------- Recurring Detector ---------------- **/
  async function detectRecurring(task) {
    const ref = collection(db, "recurringCandidates");

    const qRef = query(
      ref,
      where("issue", "==", task.issueType),
      where("centerLat", "==", task.centerLat.toFixed(4)),
      where("centerLng", "==", task.centerLng.toFixed(4))
    );

    const snap = await getDocs(qRef);

    if (snap.empty) {
      await addDoc(ref, {
        issue: task.issueType,
        centerLat: task.centerLat.toFixed(4),
        centerLng: task.centerLng.toFixed(4),
        occurrences: [Date.now()]
      });
      return;
    }

    const docRef = snap.docs[0].ref;
    const data = snap.docs[0].data();

    const updated = [...data.occurrences, Date.now()];
    await updateDoc(docRef, { occurrences: updated });

    if (updated.length >= 3) {
      let intervals = [];

      for (let i = 1; i < updated.length; i++) {
        intervals.push(updated[i] - updated[i - 1]);
      }

      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const days = Math.max(1, Math.round(avg / (1000 * 60 * 60 * 24)));

      await addDoc(collection(db, "recurringSuggestions"), {
        title: task.issueType,
        issue: task.issueType,
        location: { lat: task.centerLat, lng: task.centerLng },
        frequencyDays: days,
        createdAt: new Date()
      });

      await updateDoc(docRef, { occurrences: [] });
    }
  }


  /** ---------------- Assign Worker ---------------- **/
  async function assignTask(task, workerId) {
    if (workerId === "Select") return;

    await addDoc(collection(db, "tasks"), {
      issueType: task.issueType,
      complaints: task.complaints.map(c => c.id),
      centerLat: task.centerLat,
      centerLng: task.centerLng,
      priorityScore: task.priorityScore,
      assignedWorkerId: workerId,
      status: "ongoing",
      createdAt: new Date()
    });

    for (const c of task.complaints) {
      await updateDoc(doc(db, "complaints", c.id), { status: "ongoing" });
    }

    detectRecurring(task);

    loadData();
  }


  /** ---------------- UI ---------------- **/
  return (
    <div>
      <h2 className="text-4xl font-[500] text-[#244034] pb-5">
        Suggested Tasks
      </h2>

      {loading && <p>Loading…</p>}

      {!suggestedTasks.length && !loading && (
        <p className="text-gray-500">
          No tasks required currently 🎉
        </p>
      )}

      <div className="space-y-5">
        {suggestedTasks.map((task, index) => (
          <div key={index} className="bg-white shadow-sm rounded-xl p-5 border">

            <div className="flex justify-between items-start">

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

              <div>
                <select
                  className="border rounded-xl px-4 py-2 text-sm"
                  onChange={(e) => assignTask(task, e.target.value)}
                >
                  <option value="Select">Select Worker</option>

                  {workers.map(w => (
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
