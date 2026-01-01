import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GOOGLE_MAPS_KEY } from '../googleMaps';

import usericon from '../assets/usericon.svg';
import bookmark from '../assets/boomark.svg';
import write from '../assets/write.svg';

function Maincontent() {

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
                <GoogleMap zoom={14} center={center} mapContainerStyle={{ width:"100%",height:"100%" }}>
                  {complaints.map(c=>(
                    <Marker key={c.id}
                      position={{lat:c.latitude,lng:c.longitude}}
                      icon={{
                        url: c.status === "pending"
                          ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                          : c.status === "ongoing"
                          ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                          : "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                      }}
                    />
                  ))}
                </GoogleMap>
              )}
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
