import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function RecurringSuggestions() {

  const [complaints,setComplaints] = useState([]);
  const [suggestions,setSuggestions] = useState([]);
  const [workers,setWorkers] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    loadData();
  },[]);

  async function loadData(){

    const cSnap = await getDocs(collection(db,"complaints"));
    const all = cSnap.docs.map(d=>({id:d.id,...d.data()}));
    setComplaints(all);

    const wSnap = await getDocs(collection(db,"workers"));
    setWorkers(wSnap.docs.map(d=>({ firestoreId:d.id, ...d.data() })));

    setSuggestions(buildRecurringSuggestions(all));

    setLoading(false);
  }

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

  function buildRecurringSuggestions(list){
    if(!list.length) return [];

    const groups = {};

    list.forEach(c=>{
      if(!groups[c.issue]) groups[c.issue] = [];
      groups[c.issue].push(c);
    });

    let result = [];

    Object.keys(groups).forEach(issue=>{
      const arr = groups[issue];

      for(let i=0;i<arr.length;i++){
        let cluster=[arr[i]];

        for(let j=i+1;j<arr.length;j++){
          if(distance(arr[i],arr[j])<=50){
            cluster.push(arr[j]);
          }
        }

        if(cluster.length >= 4){ 
          // recurring-worthy threshold
          result.push({
            issue,
            count: cluster.length,
            location:{
              lat: cluster.reduce((s,c)=>s+c.latitude,0)/cluster.length,
              lng: cluster.reduce((s,c)=>s+c.longitude,0)/cluster.length
            }
          });
        }
      }
    });

    return result;
  }

  async function convertToRecurring(item, frequencyDays, workerId){

    await addDoc(collection(db,"recurringTasks"),{
      title: item.issue,
      issue: item.issue,
      location:item.location,
      frequencyDays,
      assignedWorkerId: workerId || null,
      nextExecution: Date.now() + (frequencyDays*24*60*60*1000),
      active:true,
      createdAt:new Date()
    });

    alert("Recurring Task Created 🎉");
  }

  return (
    <div>
      <h2 className="text-4xl font-[500] text-[#244034] pb-5">
        Recurring Suggestions
      </h2>

      {loading && <p>Loading...</p>}

      {!suggestions.length && !loading && (
        <p className="text-gray-500">
          No recurring patterns found 🎉
        </p>
      )}

      <div className="space-y-5">
        {suggestions.map((s,i)=>(
          <div key={i} className="bg-white border rounded-xl p-5 shadow-sm">

            <h3 className="text-xl text-[#244034] font-[500]">
              {s.issue}
            </h3>

            <p className="text-gray-600">
              Reported {s.count} times at same area
            </p>

            <div className="flex gap-3 mt-3">

              <select id={`freq${i}`} className="border rounded px-3 py-1">
                <option value={1}>Every Day</option>
                <option value={3}>Every 3 Days</option>
                <option value={7}>Every Week</option>
              </select>

              <select id={`worker${i}`} className="border rounded px-3 py-1">
                <option value="">Auto Assign Later</option>
                {workers.map(w=>(
                  <option key={w.firestoreId} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <button
                className="px-4 py-2 rounded-full bg-[#3f634d] text-white"
                onClick={()=>{
                  const freq = document.getElementById(`freq${i}`).value;
                  const worker = document.getElementById(`worker${i}`).value;
                  convertToRecurring(s, Number(freq), worker);
                }}
              >
                Convert To Recurring
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
