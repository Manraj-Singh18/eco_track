import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

export default function GlobalSearch() {

  const [searchText,setSearchText] = useState("");
  const [results,setResults] = useState({ complaints: [], tasks: [], workers: [] });
  const [show,setShow] = useState(false);

  useEffect(()=>{
    if(searchText.trim().length < 2){
      setResults({complaints:[],tasks:[],workers:[]});
      return;
    }

    const timeout = setTimeout(()=> runSearch(searchText),400);
    return ()=> clearTimeout(timeout);

  },[searchText]);

  async function runSearch(text){
    const word = text.toLowerCase();

    let complaints = [];
    let tasks = [];
    let workers = [];

    // Complaints search
    const cSnap = await getDocs(collection(db,"complaints"));
    complaints = cSnap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(c =>
        c.issue?.toLowerCase().includes(word) ||
        c.address?.toLowerCase().includes(word) ||
        c.landmark?.toLowerCase().includes(word) ||
        c.userid?.toLowerCase().includes(word)
      )
      .slice(0,5);

    // Tasks search
    const tSnap = await getDocs(collection(db,"tasks"));
    tasks = tSnap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(t =>
        t.issueType?.toLowerCase().includes(word)
      )
      .slice(0,5);

    // Workers search
    const wSnap = await getDocs(collection(db,"workers"));
    workers = wSnap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(w =>
        w.name?.toLowerCase().includes(word) ||
        w.phone?.toLowerCase().includes(word) ||
        w.id?.toLowerCase().includes(word)
      )
      .slice(0,5);

    setResults({ complaints,tasks,workers });
  }

  return (
    <div className="relative hidden lg:block mr-6">
      <div className="search-form w-[300px] relative">
        <i className="fa-solid fa-magnifying-glass absolute top-[15px] left-4 text-black"></i>

        <input
          type="text"
          placeholder="Search complaints, tasks, workers..."
          className="w-full px-10 rounded-full font-[300] bg-[rgba(0,0,0,0.05)] text-[rgba(0, 0, 0, 0.5)] border-none shadow-none focus:outline-none pl-[45px] pr-[15px] h-[45px] text-base"
          value={searchText}
          onChange={e=>{
            setSearchText(e.target.value);
            setShow(true);
          }}
          onBlur={()=> setTimeout(()=>setShow(false),300)}
          onFocus={()=> setShow(true)}
        />
      </div>

      {/* DROPDOWN */}
      {show && (results.complaints.length || results.tasks.length || results.workers.length) > 0 && (
        <div className="absolute top-[55px] left-0 bg-white shadow-xl rounded-2xl p-4 w-[400px] z-50">

          {/* Complaints */}
          {results.complaints.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-[#244034] mb-2">Complaints</h4>
              {results.complaints.map(c=>(
                <Link key={c.id} to="/Pages/Complaints">
                  <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <p className="font-medium">{c.issue}</p>
                    <p className="text-sm text-gray-500">{c.address}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-[#244034] mb-2">Tasks</h4>
              {results.tasks.map(t=>(
                <Link key={t.id} to="/Pages/Tasks">
                  <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <p className="font-medium">{t.issueType}</p>
                    <p className="text-sm text-gray-500">Priority: {t.priorityScore}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Workers */}
          {results.workers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#244034] mb-2">Workers</h4>
              {results.workers.map(w=>(
                <Link key={w.id} to="/Pages/Tasks">
                  <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <p className="font-medium">{w.name}</p>
                    <p className="text-sm text-gray-500">{w.phone}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
