import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function RecurringSuggestions() {

  const [suggestions,setSuggestions] = useState([]);
  const [workers,setWorkers] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    loadData();
  },[]);

  async function loadData(){

    // Load recurring suggestions detected by engine
    const sSnap = await getDocs(collection(db,"recurringSuggestions"));
    setSuggestions(
      sSnap.docs.map(d=>({ id:d.id, ...d.data() }))
    );

    // Load workers
    const wSnap = await getDocs(collection(db,"workers"));
    setWorkers(
      wSnap.docs.map(d=>({ firestoreId:d.id, ...d.data() }))
    );

    setLoading(false);
  }

  async function convertToRecurring(item, frequencyDays, workerId){

    await addDoc(collection(db,"recurringTasks"),{
      title: item.title || item.issue,
      issue: item.issue,
      location: item.location,
      frequencyDays,
      assignedWorkerId: workerId || null,
      nextExecution: new Date(Date.now() + (frequencyDays*24*60*60*1000)),
      lastRun: null,
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

          <div key={s.id} className="bg-white border rounded-xl p-5 shadow-sm">

            <h3 className="text-xl text-[#244034] font-[500]">
              {s.issue}
            </h3>

            <p className="text-gray-600">
              Suggested recurring hotspot detected
            </p>

            <p className="text-gray-500 text-sm">
              📍 Lat: {s.location?.lat?.toFixed(5)} — Lng: {s.location?.lng?.toFixed(5)}
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
