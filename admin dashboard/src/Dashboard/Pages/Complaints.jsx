import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function Complaints() {

  const [complaints, setComplaints] = useState([]);
  const [loading,setLoading] = useState(true);
  const [sortType,setSortType] = useState("newest");

  // Modal
  const [showModal,setShowModal] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints(){
    const snap = await getDocs(collection(db,"complaints"));
    const data = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    setComplaints(sortComplaints(data, sortType));
    setLoading(false);
  }

  function sortComplaints(data, type){
    const sorted = [...data];

    if(type === "newest")
      sorted.sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds);

    if(type === "oldest")
      sorted.sort((a,b)=>a.createdAt?.seconds - b.createdAt?.seconds);

    if(type === "status")
      sorted.sort((a,b)=>a.status.localeCompare(b.status));

    if(type === "issue")
      sorted.sort((a,b)=>a.issue.localeCompare(b.issue));

    return sorted;
  }

  function handleSort(type){
    setSortType(type);
    setComplaints(prev => sortComplaints(prev, type));
  }

  async function updateStatus(id,status){
    await updateDoc(doc(db,"complaints",id),{ status });
    fetchComplaints();
  }

  async function deleteComplaint(id){
    await deleteDoc(doc(db,"complaints",id));
    fetchComplaints();
  }

  async function deleteAllCompleted(){
    setShowModal(false);

    const completed = complaints.filter(c=>c.status==="completed");

    await Promise.all(
      completed.map(c => deleteDoc(doc(db,"complaints",c.id)))
    );

    fetchComplaints();
  }

  const completedCount = complaints.filter(c=>c.status==="completed").length;

  return (
    <div>
      <h2 className="text-4xl font-[500] text-[#244034] pb-6">
        Complaints
      </h2>

      {/* SORT & DELETE BAR */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">

        <div className="flex gap-3">
          <button
            className={`px-5 py-2 rounded-full text-sm border transition-all ${
              sortType==="newest" ? "bg-[#3f634d] text-white" : "bg-white"
            }`}
            onClick={()=>handleSort("newest")}
          >
            Newest
          </button>

          <button
            className={`px-5 py-2 rounded-full text-sm border transition-all ${
              sortType==="oldest" ? "bg-[#3f634d] text-white" : "bg-white"
            }`}
            onClick={()=>handleSort("oldest")}
          >
            Oldest
          </button>

          <button
            className={`px-5 py-2 rounded-full text-sm border transition-all ${
              sortType==="status" ? "bg-[#3f634d] text-white" : "bg-white"
            }`}
            onClick={()=>handleSort("status")}
          >
            Status
          </button>

          <button
            className={`px-5 py-2 rounded-full text-sm border transition-all ${
              sortType==="issue" ? "bg-[#3f634d] text-white" : "bg-white"
            }`}
            onClick={()=>handleSort("issue")}
          >
            Issue Type
          </button>
        </div>

        {/* DELETE ALL COMPLETED BUTTON */}
        {completedCount > 0 && (
          <button
            onClick={()=>setShowModal(true)}
            className="px-6 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-700 transition"
          >
            Delete All Completed ({completedCount})
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {loading && <p>Loading...</p>}

        {!complaints.length && !loading && (
          <p className="text-gray-500">No complaints found.</p>
        )}

        <div className="space-y-5">
          {complaints.map(c=>(
            <div key={c.id}
            className="border rounded-xl p-4 flex justify-between items-start">

              <div>
                <h3 className="text-xl text-[#244034] font-[500] mb-1">
                  {c.issue}
                </h3>

                <p className="text-gray-600 text-sm">
                  📍 {c.address}
                </p>

                {c.landmark && (
                  <p className="text-gray-500 text-sm">
                    Landmark: {c.landmark}
                  </p>
                )}

                <p className="text-gray-400 text-sm mt-1">
                  {c.createdAt?.seconds &&
                    new Date(c.createdAt.seconds * 1000).toLocaleString()
                  }
                </p>

                <span className={`
                  inline-block mt-2 px-3 py-1 rounded-full text-sm
                  ${c.status==="pending" && "bg-red-100 text-red-700"}
                  ${c.status==="ongoing" && "bg-yellow-100 text-yellow-700"}
                  ${c.status==="completed" && "bg-green-100 text-green-700"}
                `}>
                  {c.status.toUpperCase()}
                </span>
              </div>

              {/* STATUS CONTROLS */}
              <div className="flex flex-col gap-2">

                {c.status !== "pending" && (
                  <button
                    onClick={()=>updateStatus(c.id,"pending")}
                    className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-sm hover:bg-red-200"
                  >
                    Mark Pending
                  </button>
                )}

                {c.status !== "ongoing" && (
                  <button
                    onClick={()=>updateStatus(c.id,"ongoing")}
                    className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm hover:bg-yellow-200"
                  >
                    Mark Ongoing
                  </button>
                )}

                {c.status !== "completed" && (
                  <button
                    onClick={()=>updateStatus(c.id,"completed")}
                    className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm hover:bg-green-200"
                  >
                    Mark Completed
                  </button>
                )}

                {/* DELETE ONLY IF COMPLETED */}
                {c.status === "completed" && (
                  <button
                    onClick={()=>deleteComplaint(c.id)}
                    className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    Delete Complaint
                  </button>
                )}

              </div>

            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <div className="bg-white p-10 rounded-2xl w-[450px] text-center shadow-xl">

            <h2 className="text-3xl font-[600] text-[#244034] mb-4">
              Delete Completed Complaints?
            </h2>

            <p className="text-gray-500 mb-6">
              This will permanently delete <b>{completedCount}</b> completed complaints.
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-6">
              <button
                onClick={deleteAllCompleted}
                className="bg-red-600 text-white px-8 py-2 rounded-full hover:bg-red-700 transition"
              >
                Delete All
              </button>

              <button
                onClick={()=>setShowModal(false)}
                className="px-8 py-2 rounded-full border text-[#244034] hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
