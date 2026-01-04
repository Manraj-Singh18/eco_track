import React, { useState, useEffect } from "react";
import user from '../assets/user.jpg';

import dashboard1 from '../assets/dashbord-icon-01.svg';
import dashboard2 from '../assets/dashbord-icon-02.svg';

import deleteicon from '../assets/delete-icon-01.svg';

import note1 from '../assets/note-icon-01.svg';
import note2 from '../assets/note-icon-02.svg';

import pen1 from '../assets/pen-icon-01.svg';
import pen2 from '../assets/pen-icon-02.svg';

import profile1 from '../assets/profile-icon-01.svg';
import profile2 from '../assets/profile-icon-02.svg';

import setting1 from '../assets/setting-icon-01.svg';
import setting2 from '../assets/setting-icon-02.svg';

import logout from '../assets/logout-icon-01.svg';
import notification from '../assets/notification-icon.svg';

import notification1 from '../assets/notification-icon1.svg';
import notification2 from '../assets/notification-icon2.svg';
import notification3 from '../assets/notification-icon3.svg';

import menuopen from '../assets/menu-open.png';
import menuclose from '../assets/menu-close.png';

import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logoutAdmin } from "../auth";
import GlobalSearch from "./GlobalSearch";

import logoutdelete from '../assets/logout-delete.svg';

function Dashboard() {

  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isnotification, setIsnotification] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleSidebar = () => setIsSidebarActive(!isSidebarActive);
  const closeSidebar = () => setIsSidebarActive(false);

  /** ---------------- NAV ITEMS ---------------- **/
  const navItems = [
    { name: 'My Profile', path: '/Pages/MyProfile', icon1: profile1, icon2: profile2 },
    { name: 'Tasks', path: '/Pages/Tasks', icon1: note1, icon2: note2 },
    { name: 'Complaints', path: '/Pages/Complaints', icon1: pen1, icon2: pen2 },
    { name: 'Account Settings', path: '/Pages/AccountSettings', icon1: setting1, icon2: setting2 },
    { name: 'Recurring Suggestions', path: '/Pages/RecurringSuggestions', icon1: note1, icon2: note2 },
    { name: 'Recurring Tasks', path: '/Pages/RecurringTasks', icon1: note1, icon2: note2 },
  ];

  /** ---------------- ACTIVE STATE HANDLING ---------------- **/
  const [activeItem, setActiveItem] = useState("Dashboard");

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveItem("Dashboard");
    } else {
      const match = navItems.find(n => location.pathname.startsWith(n.path.replace("/Pages/", "")));
      if (match) setActiveItem(match.name);
    }
  }, [location.pathname]);

  const handledelete = () => setShowModal(true);

  return (
    <>
      <div className="dashboard-wrapper relative w-full flex items-start justify-between bg-[#f0f5f3] min-h-[100vh]">

        {/* ---------------- SIDEBAR ---------------- */}
        <div className={`sidebar bg-white shadow-lg pt-[30px] px-[20px] ${isSidebarActive ? 'active':''}`}>
          
          <img src={menuclose} alt="menu-close"
            onClick={closeSidebar}
            className="w-[30px] h-[30px] absolute right-0 top-0 m-5 cursor-pointer z-20 flex lg:hidden"/>

          <div className="logo w-full text-center mb-5 pb-5">
            <button className="cursor-pointer">
              <h2 className="text-4xl font-[600] tracking-wide">
                Eco<span className="text-[#d2f34c]">Track</span>
              </h2>
            </button>
          </div>

          <div className="admin-info text-center mb-10">
            <img src={user} alt="user"
              className="w-[120px] h-[120px] mx-auto rounded-full"/>

            <div>
              <button onClick={() => setIsOpen(!isOpen)}
                className="user-name text-xl relative font-[500] py-3 w-full">
                John Smith

                <ul className={`dropdown-menu absolute left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-md shadow-md p-5 space-y-3 transition-all duration-300 ease-in-out z-10 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>

                  <li>
                    <span className="flex gap-2 items-center">
                      <img src={profile1} className="w-[18px]"/>
                      <span>Profile</span>
                    </span>
                  </li>

                  <li>
                    <span className="flex gap-2 items-center">
                      <img src={setting1} className="w-[18px]"/>
                      <span>Account Settings</span>
                    </span>
                  </li>

                  <li>
                    <span className="flex gap-2 items-center">
                      <img src={notification} className="w-[18px]"/>
                      <span>Notification</span>
                    </span>
                  </li>
                </ul>
              </button>
            </div>
          </div>

          <ul className="dashboard-main-nav">

            {/* Dashboard */}
            <li>
              <Link
                to="/"
                onClick={() => { setActiveItem("Dashboard"); closeSidebar(); }}
                className={`flex items-center w-full gap-2 p-5 rounded-2xl ${activeItem === 'Dashboard' ? 'active':''}`}
              >
                <img src={dashboard1}
                  className={`w-[18px] ${activeItem==="Dashboard"?'opacity-0 absolute':'opacity-100 relative'}`}/>
                <img src={dashboard2}
                  className={`w-[18px] ${activeItem==="Dashboard"?'opacity-100 relative':'opacity-0 absolute'}`}/>
                <span className="text-lg ps-2 font-[500]">Dashboard</span>
              </Link>
            </li>

            {/* Auto Nav Pages */}
            {navItems.map(item => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => { setActiveItem(item.name); closeSidebar(); }}
                  className={`flex items-center w-full gap-2 p-5 rounded-2xl ${activeItem === item.name ? 'active' : ''}`}
                >
                  <img src={item.icon1} className={`w-[18px] ${activeItem===item.name?'opacity-0 absolute':'opacity-100 relative'}`}/>
                  <img src={item.icon2} className={`w-[18px] ${activeItem===item.name?'opacity-100 relative':'opacity-0 absolute'}`}/>
                  <span className="text-lg ps-2 font-[500]">{item.name}</span>
                </Link>
              </li>
            ))}

            {/* Delete Button */}
            <li>
              <button onClick={handledelete}
                className="flex items-center w-full p-5 rounded-2xl gap-2">
                <img src={deleteicon} className="w-[18px]"/>
                <span className="text-lg">Delete</span>
              </button>
            </li>

          </ul>

          {/* Profile Status */}
          <div className="profile-complete-status py-8 px-5">
            <h4 className="text-xl font-normal">87%</h4>
            <div className="process-line"></div>
            <p>Profile Complete</p>
          </div>

          {/* Logout */}
          <ul>
            <li>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center w-full hover:text-red-500 duration-300 gap-2 p-5 rounded-2xl"
              >
                <img src={logout} className="w-[18px]"/>
                <span className="text-lg">Logout</span>
              </button>
            </li>
          </ul>

          {/* ---------- Delete Modal ---------- */}
          {showModal && (
            <Modal
              title="Are you sure?"
              text="Are you sure to delete your account? All data will be lost"
              confirm={() => {
                setShowModal(false);
                console.log("Account delete clicked");
              }}
              cancel={() => setShowModal(false)}
            />
          )}

          {/* ---------- Logout Modal ---------- */}
          {showLogoutModal && (
            <Modal
              title="Are you sure?"
              text="Are you sure you want to logout?"
              confirm={async ()=> {
                await logoutAdmin();
                setShowLogoutModal(false);
                navigate("/login");
              }}
              cancel={() => setShowLogoutModal(false)}
            />
          )}

        </div>

        {/* ---------------- MAIN CONTENT ---------------- */}
        <div className="main bg-[#f0f5f3] w-full ml-[350px] overflow-y-scroll">

          <div className="nav-main flex justify-end gap-4 items-center z-50">

            <img src={menuopen}
              onClick={toggleSidebar}
              className="mr-auto w-[30px] h-[30px] cursor-pointer lg:hidden"/>

            <GlobalSearch/>

            {/* Notifications */}
            <button className="nav-notification relative" onClick={() => setIsnotification(!isnotification)}>
              <img src={notification} className="h-[25px] w-[25px]"/>
              <div className="badge-pill"></div>

              <div className={`absolute left-[-150px] top-[40px] w-[250px] bg-white rounded-xl shadow-md p-5 space-y-4 transition-all duration-300 ${isnotification?'opacity-100 visible':'opacity-0 invisible'}`}>
                <h3 className="font-semibold text-xl">Notification</h3>

                {[notification1,notification2,notification3].map((i,x)=>(
                  <div key={x} className="flex gap-2 relative">
                    <img src={i} className="w-10 h-10"/>
                    <div>
                      <h6>You have new mail</h6>
                      <span className="text-sm text-gray-500">few hours ago</span>
                    </div>
                    <div className="badge-pill"></div>
                  </div>
                ))}
              </div>
            </button>

            <Link
              to="Pages/Complaints"
              onClick={()=>setActiveItem("Complaints")}
              className="bg-[#3f634d] text-white hover:bg-[#d2f34c] hover:text-[#244034] py-3 px-6 rounded-full"
            >
              View Complaints
            </Link>
          </div>

          <div className="content w-full">
            <Outlet/>
          </div>

        </div>

      </div>
    </>
  );
}

export default Dashboard;


function Modal({title,text,confirm,cancel}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-12 rounded-xl text-center w-full max-w-xl mx-auto shadow-lg">

        <div className="flex justify-center py-5">
          <img src={logoutdelete} className="w-[100px] h-[100px]"/>
        </div>

        <h2 className="text-4xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-500 mb-6">{text}</p>

        <div className="flex justify-center gap-6">
          <button
            onClick={confirm}
            className="bg-[#2c6c50] hover:bg-[#d2f34c] hover:text-[#244034] text-white px-8 py-2 rounded-lg text-lg font-[500]">
              Yes
          </button>

          <button
            onClick={cancel}
            className="text-[#2c6c50] hover:underline text-lg font-[500]">
              Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
