import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

export default function RecurringManager(){

  const [tasks,setTasks] = useState([]);
  const [workers,setWorkers] = useState([]);

  useEffect(()=>{ load(); },[]);

  async function load(){
    const s = await getDocs(collection(db,"recurringTasks"));
    setTasks(s.docs.map(d=>({id:d.id,...d.data()})));

    const wSnap = await getDocs(collection(db,"workers"));
    setWorkers(wSnap.docs.map(d=>({firestoreId:d.id,...d.data()})));
  }

  async function toggleActive(id,val){
    await updateDoc(doc(db,"recurringTasks",id),{active:val});
    load();
  }

  async function changeFrequency(id,val){
    await updateDoc(doc(db,"recurringTasks",id),{frequencyDays:Number(val)});
    load();
  }

  async function changeWorker(id,val){
    await updateDoc(doc(db,"recurringTasks",id),{assignedWorkerId:val});
    load();
  }

  async function removeTask(id){
    if(!confirm("Delete recurring task?")) return;
    await deleteDoc(doc(db,"recurringTasks",id));
    load();
  }

  return(
    <div>
      <h2 className="text-4xl font-[500] text-[#244034] pb-5">
        Recurring Tasks Manager
      </h2>

      {!tasks.length && (
        <p className="text-gray-500">No recurring tasks yet.</p>
      )}

      <div className="space-y-5">
        {tasks.map(t=>(
          <div key={t.id} className="bg-white border rounded-xl p-5">

            <h3 className="text-[#244034] text-2xl font-[500]">
              {t.title}
            </h3>

            <p className="text-gray-600">
              Every {t.frequencyDays} days
            </p>

            <div className="flex gap-4 mt-4">

              <button
                className={`px-4 py-2 rounded-full text-white ${
                  t.active ? "bg-red-500" : "bg-green-600"
                }`}
                onClick={()=>toggleActive(t.id,!t.active)}
              >
                {t.active ? "Pause" : "Resume"}
              </button>

              <select
                className="border rounded px-3"
                onChange={(e)=>changeFrequency(t.id,e.target.value)}
                defaultValue={t.frequencyDays}
              >
                <option value={1}>Daily</option>
                <option value={3}>Every 3 days</option>
                <option value={7}>Weekly</option>
              </select>

              <select
                className="border rounded px-3"
                onChange={(e)=>changeWorker(t.id,e.target.value)}
                defaultValue={t.assignedWorkerId || ""}
              >
                <option value="">Auto Assign</option>
                {workers.map(w=>(
                  <option key={w.firestoreId} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <button
                className="px-4 py-2 rounded-full bg-red-700 text-white"
                onClick={()=>removeTask(t.id)}
              >
                Delete
              </button>

            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
