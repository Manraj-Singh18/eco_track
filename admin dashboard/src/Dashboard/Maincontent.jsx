import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GOOGLE_MAPS_KEY } from '../googleMaps';

import usericon from '../assets/usericon.svg';
import bookmark from '../assets/boomark.svg';
import write from '../assets/write.svg';

function Maincontent() {
  let recurringRunning = false;
  async function runRecurringEngine(){

    if(recurringRunning){
      console.log("Recurring Engine already running - blocked duplicate");
      return;
    }
    recurringRunning = true;

    try {
      console.log("Recurring Engine Running...");

      const snap = await getDocs(
        query(collection(db,"recurringTasks"), where("active","==",true))
      );

      const now = Date.now();

      for(const d of snap.docs){

        const data = d.data();
        let next = data.nextExecution;

        if(next?.toMillis) next = next.toMillis();

        if(now >= next){

          const cSnap = await getDocs(
            collection(db,"complaints")
          );
          const allComplaints = cSnap.docs.map(d=>({id:d.id,...d.data()}));
          const nearby = allComplaints.filter(c=>
            distance(
              {latitude: data.location.lat, longitude:data.location.lng},
              {latitude:c.latitude, longitude:c.longitude}
            ) <= 60 && c.status==="pending"
          );
          const taskRef = await addDoc(collection(db,"tasks"),{
            issueType: data.issue,
            complaints: nearby.map(c=>c.id),
            centerLat: data.location.lat,
            centerLng: data.location.lng,
            priorityScore: 100,
            assignedWorkerId: data.assignedWorkerId || null,
            status:"ongoing",
            createdAt: new Date()
          });
          for(const c of nearby){
            await updateDoc(doc(db,"complaints",c.id),{
              status:"ongoing"
            });
          }
        }
      }

    } catch(e){
      console.error("Recurring Engine Error", e);
    } finally {
      recurringRunning = false;
    }
  }

  async function fetchRecurring(){
    const snap = await getDocs(collection(db,"recurringTasks"));
    setRecurringTasks(snap.docs.map(d=>({id:d.id,...d.data()})));
  }


  const [recurringTasks,setRecurringTasks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workers,setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const dropdownRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Modal
  const [selectedTask,setSelectedTask] = useState(null);

  useEffect(() => {
    const handler = e => {
      if(!dropdownRefs.current.some(ref => ref?.contains(e.target))){
        setActiveIndex(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY
  });

  useEffect(() => {
    fetchComplaints();
    fetchTasks();
    fetchWorkers();
    runRecurringEngine();
    fetchRecurring();
  }, []);

  async function fetchComplaints(){
    const snap = await getDocs(collection(db,"complaints"));
    setComplaints(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    setLoading(false);
  }

  async function fetchTasks(){
    const q = query(collection(db,"tasks"), where("status","==","ongoing"));
    const snap = await getDocs(q);
    setTasks(snap.docs.map(d=>({ id:d.id, ...d.data() })));
  }

  async function fetchWorkers(){
    const wSnap = await getDocs(collection(db,"workers"));
    setWorkers(wSnap.docs.map(d=>({ firestoreId:d.id, ...d.data() })));
  }

  const center = complaints.length
    ? { lat: complaints[0].latitude, lng: complaints[0].longitude }
    : { lat: 28.6139, lng: 77.2090 };

  async function markComplete(task){
    for(const cid of task.complaints){
      await updateDoc(doc(db,"complaints",cid),{status:"completed"});
    }

    await deleteDoc(doc(db,"tasks",task.id));

    fetchTasks();
    fetchComplaints();
  }

  async function reassignWorker(task,newWorkerId){
    await updateDoc(doc(db,"tasks",task.id),{
      assignedWorkerId:newWorkerId
    });

    fetchTasks();
  }

  async function cancelTask(task){
    if(!confirm("Cancel this task? Complaints will return to pending.")) return;

    await deleteDoc(doc(db,"tasks",task.id));

    for(const cid of task.complaints){
      await updateDoc(doc(db,"complaints",cid),{status:"pending"});
    }

    fetchTasks();
    fetchComplaints();
  }

  // Stats
  const todayComplaints = complaints.length;
  const resolvedToday = complaints.filter(c=>c.status==="completed").length;
  const tasksToday = tasks.length;

  const getWorker = (id) => workers.find(w=>w.id===id);

  return (
    <>
      <h2 className='text-4xl font-[500] text-[#244034] pb-4'>Dashboard!</h2>

      {/* -------- TOP STATS -------- */}
      <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 md:gap-6 gap-10 py-5'>
        {[
          { value: todayComplaints, label: 'Total Complaints', icon: usericon },
          { value: resolvedToday, label: 'Complaints Resolved', icon: bookmark },
          { value: tasksToday, label: 'Ongoing Tasks', icon: write },
        ].map((item, idx) => (
          <div key={idx} className='dashboard-item bg-white rounded-[30px] shadow-[0_6px_6px_rgba(0,0,0,0.02)] flex items-start justify-between relative'>
            <div className='flex flex-col items-start z-[9]'>
              <div className='text-5xl mb-1 font-semibold text-[#244034]'>{item.value}</div>
              <span className='text-lg font-[300] text-[rgba(0,0,0,0.5)]'>{item.label}</span>
            </div>
            <div className='bg-[#d2f34c] rounded-full w-16 h-16 flex items-center justify-center z-[9]'>
              <img src={item.icon} className='w-8 h-8'/>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- MAP + TASKS ---------------- */}
      <div className='grid grid-cols-1 lg:grid-cols-2 md:gap-6 gap-10 pt-14'>

        {/* -------- GOOGLE MAP -------- */}
        <div className='bg-white rounded-xl shadow-sm card-item'>
          <h2 className='font-semibold header-text' style={{ borderBottom:'1px solid #e3f0eb' }}>
            Complaints Map
          </h2>
          <div className='header-body-content'>
            <div className='w-full h-[400px] rounded-2xl overflow-hidden border'>
              {!isLoaded ? (
                <p className='text-center pt-10'>Loading Map...</p>
              ) : (
                <GoogleMap
                  zoom={14}
                  center={center}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                >
                  {/* Complaint markers */}
                  {complaints.map(c => (
                    <Marker
                      key={c.id}
                      position={{ lat: c.latitude, lng: c.longitude }}
                      icon={{
                        url:
                          c.status === "pending"
                            ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            : c.status === "ongoing"
                            ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                            : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                      }}
                    />
                  ))}

                  {/* Recurring tasks markers */}
                  {recurringTasks.map(r => (
                    <Marker
                      key={r.id}
                      position={{ lat: r.location.lat, lng: r.location.lng }}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                      }}
                      title={`${r.title} — every ${r.frequencyDays} days`}
                    />
                  ))}
                </GoogleMap>
              )}
            </div>

            {/* 🔥 LEGEND (this is what you were missing visually) */}
            <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-600">

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Pending Complaints
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                Ongoing Complaints
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Completed Complaints
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Recurring Task Area
              </div>

            </div>

          </div>

        </div>

        {/* -------- ASSIGNED TASKS -------- */}
        <div className="bg-white rounded-xl shadow-sm card-item">
          <h2 className='font-semibold header-text' style={{ borderBottom:'1px solid #e3f0eb' }}>
            Assigned Tasks
          </h2>

          <ul className='w-full header-body-content space-y-7'>
            {!tasks.length && <p className="text-gray-500">No ongoing tasks</p>}

            {tasks.map((task,index)=>{

              const worker = getWorker(task.assignedWorkerId);

              return (
                <li key={task.id} className='flex justify-between items-start w-full'>
                  <div className='job-title'>
                    <h3 className="text-xl text-[#244034] font-[500]">{task.issueType}</h3>
                    {worker && (
                      <>
                        <p className="text-gray-600">👷 {worker.name}</p>
                        <p className="text-gray-500 text-sm">{worker.phone}</p>
                      </>
                    )}
                    <p className="text-gray-400 text-sm">
                      {task.complaints.length} complaints grouped
                    </p>
                  </div>

                  <div className='relative' ref={el=> dropdownRefs.current[index]=el}>
                    <div className='job-action cursor-pointer' onClick={()=>setActiveIndex(p=>p===index?null:index)}>
                      <i className="fa-solid fa-ellipsis text-xl text-[rgba(36,64,52,.5)]"></i>
                    </div>

                    <ul className={`absolute left-[-160px] top-[40px] text-start mt-2 w-[210px] bg-white rounded-xl shadow-md p-2 space-y-2 z-[10] transition-all ${activeIndex===index?'opacity-100 visible':'opacity-0 invisible'}`}>

                      <li className='py-2 px-4 hover:bg-gray-100 cursor-pointer text-[#244034]'
                        onClick={()=>setSelectedTask(task)}>
                        View Task Details
                      </li>

                      <li className='py-2 px-4 hover:bg-gray-100 cursor-pointer text-[#244034]'>
                        <select className='w-full bg-transparent outline-none'
                          onChange={(e)=>reassignWorker(task,e.target.value)}>
                          <option>Reassign Worker</option>
                          {workers.map(w=>(
                            <option key={w.firestoreId} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </li>

                      <li className='py-2 px-4 hover:bg-gray-100 cursor-pointer text-[#244034]'
                        onClick={()=>markComplete(task)}>
                        Mark Complete
                      </li>

                      <li className='py-2 px-4 hover:bg-gray-100 cursor-pointer text-red-500'
                        onClick={()=>cancelTask(task)}>
                        Cancel Task
                      </li>
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* -------- TASK DETAILS MODAL -------- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <div className="bg-white p-8 rounded-2xl w-[600px]">
            <h2 className="text-2xl font-[500] text-[#244034] mb-4">
              Task Details — {selectedTask.issueType}
            </h2>

            <p className="text-gray-600">
              Complaints Included:
            </p>

            <ul className="mt-3 max-h-[250px] overflow-y-auto space-y-2">
              {selectedTask.complaints.map((id)=>(
                <li key={id} className="bg-gray-100 p-2 rounded">
                  Complaint ID: {id}
                </li>
              ))}
            </ul>

            <div className="flex justify-end mt-6">
              <button
                className="px-6 py-2 rounded-full bg-[#3f634d] text-white"
                onClick={()=>setSelectedTask(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
}

export default Maincontent;

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