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

    const [isOpen, setIsOpen] = useState(false);
    const [isnotification, setIsnotification] = useState(false);

    const location = useLocation();
    const [activeItem, setActiveItem] = useState('Dashboard');

    useEffect(() => {
    if (location.pathname === "/") setActiveItem("Dashboard");

    else if (location.pathname.includes("MyProfile")) setActiveItem("My Profile");
    else if (location.pathname.includes("Tasks")) setActiveItem("Tasks");
    else if (location.pathname.includes("Complaints")) setActiveItem("Complaints");
    else if (location.pathname.includes("Resolve")) setActiveItem("Resolve");
    else if (location.pathname.includes("AccountSettings")) setActiveItem("Account Settings");

    }, [location.pathname]);


    const [isSidebarActive, setIsSidebarActive] = useState(false);

    const toggleSidebar = () => setIsSidebarActive(!isSidebarActive);

    const closeSidebar = () => setIsSidebarActive(false);

    const navItems = [
        { name: 'My Profile', icon1: profile1, icon2: profile2 },
        { name: 'Tasks', icon1: note1, icon2: note2 },
        { name: 'Complaints', icon1: pen1, icon2: pen2 },
        { name: 'Account Settings', icon1: setting1, icon2: setting2 }
    ];

    const [ showModal, setShowModal ] = useState(false);
    const [ showLogoutModal, setShowLogoutModal ] = useState(false);

    const handledelete = () => setShowModal(true);

    const confirmLogout = () => {
        setShowModal(false);
        console.log('user Logged out');
    }

    return (
        <>
        <div className="dashboard-wrapper relative w-full flex items-start justify-between bg-[#f0f5f3] min-h-[100vh]">
            {/** sidebar */}
            <div className={`sidebar bg-white shadow-lg pt-[30px] px-[20px] ${isSidebarActive ? 'active':''}`}>
                <img src={menuclose} alt="menu-close" onClick={closeSidebar} className="w-[30px] h-[30px] absolute right-0 top-0 m-5 cursor-pointer z-20 flex lg:hidden"/>
                <div className="logo w-full text-center mb-5 pb-5"><a href="#"><h2 className="text-4xl font-[600] tracking-wide">Eco<span className="text-[#d2f34c]">Track</span></h2></a></div>
                <div className="admin-info text-center mb-10">
                    <img src={user} alt="user-image" className="w-[120px] h-[120px] mx-auto rounded-full"/>
                    <div>
                        <button onClick={() => setIsOpen(!isOpen)} className="user-name text-xl relative font-[500] py-3 w-full">
                            John Smith
                            <ul className={`dropdown-menu absolute left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-md shadow-md p-5 space-y-3 transition-all duration-300 ease-in-out z-10 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                                <li>
                                    <a href="#" className="flex group items-center w-full gap-2">
                                        <img src={profile1} alt="profile-icon" className="w-[18px]"/>
                                        <span className="text-lg group-hover:text-[#3c8968] transition-colors duration-300">Profile</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex group items-center w-full gap-2">
                                        <img src={setting1} alt="setting-icon" className="w-[18px]"/>
                                        <span className="text-lg group-hover:text-[#3c8968] transition-colors duration-300">Account Settings</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="flex group items-center w-full gap-2">
                                        <img src={notification} alt="notification-icon" className="w-[18px]"/>
                                        <span className="text-lg group-hover:text-[#3c8968] transition-colors duration-300">Notification</span>
                                    </a>
                                </li>
                            </ul>
                        </button>
                    </div>
                </div>

                <ul className="dashboard-main-nav">
                    <li>
                        <Link
                            to='/'
                            onClick={() => setActiveItem('Dashboard')}
                            className={`flex items-center w-full gap-2 p-5 rounded-2xl ${activeItem === 'Dashboard' ? 'active' : ''}`}
                        >
                            <img src={dashboard1} alt="dashboard-icon" className={`w-[18px] transition-opacity duration-300 ease-in-out ${activeItem === "Dashboard" ? 'opacity-0 absolute' : 'opacity-100 relative'}`} />
                            <img src={dashboard2} alt="dashboard-icon" className={`w-[18px] transition-opacity duration-300 ease-in-out ${activeItem === "Dashboard" ? 'opacity-100 relative' : 'opacity-0 absolute'}`} />
                            <span className="text-lg ps-2 font-[500]">Dashboard</span>
                        </Link>
                    </li>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <Link
                                to={`/Pages/${item.name.replace(/\s/g, '')}`}
                                onClick={() => setActiveItem(item.name)}
                                className={`flex items-center w-full gap-2 p-5 rounded-2xl ${activeItem === item.name ? 'active' : ''}`}
                            >
                                <img src={item.icon1} alt={`${item.name}-icon1`} className={`w-[18px] transition-opacity duration-300 ease-in-out ${activeItem === item.name ? 'opacity-0 absolute' : 'opacity-100 relative'}`}/>
                                <img src={item.icon2} alt={`${item.name}-icon2`} className={`w-[18px] transition-opacity duration-300 ease-in-out ${activeItem === item.name ? 'opacity-100 relative' : 'opacity-0 absolute'}`}/>
                                <span className="text-lg ps-2 font-[500]">{item.name}</span>
                            </Link>
                        </li>
                    ))}

                    <li>
                        <button onClick={handledelete} className="flex items-center w-full p-5 rounded-2xl gap-2">
                            <img src={deleteicon} alt="delete-icon" className="w-[18px]"/>
                            <span className="text-lg">Delete</span>
                        </button>
                    </li>
                </ul>

                <div className="profile-complete-status py-8 px-5">
                    <h4 className="text-xl font-normal">87%</h4>
                    <div className="process-line"></div>
                    <p>Profile Complete</p>
                </div>

                <li>
                    <button onClick={() => setShowLogoutModal(true)} className="flex items-center w-full hover:text-red-500 duration-300 transition-colors gap-2 p-5 rounded-2xl cursor-pointer">
                        <img src={logout} alt="logout-icon" className="w-[18px]"/>
                        <span className="text-lg">Logout</span>
                    </button>
                </li>

                {/** Delete Modal */}
                { showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-12 rounded-xl text-center w-full max-w-xl mx-auto shadow-lg">
                            <div className="flex justify-center items-center w-full py-5">
                                <img src={logoutdelete} alt="delete-icon" className="w-[100px] h-[100px]"/>
                            </div>
                            <h2 className="text-4xl font-semibold text-black mb-2">Are you sure?</h2>
                            <p className="text-gray-500 mb-6 font-[300]">
                                Are you sure to delete your account? All data will be lost
                            </p>

                            <div className="flex justify-center gap-6">
                                <button
                                onClick={confirmLogout}
                                className="bg-[#2c6c50] hover:bg-[#d2f34c] hover:text-[#244034] transition-colors duration-300 text-white px-8 py-2 rounded-lg text-lg font-[500]">
                                    Yes
                                </button>
                                <button onClick={() => setShowModal(false)} className="text-[#2c6c50] hover:underline font-[500] text-lg">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/** Logout Modal */}
                { showLogoutModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-12 rounded-xl text-center w-full max-w-xl mx-auto shadow-lg">
                            <div className="flex justify-center items-center w-full py-5">
                                <img src={logoutdelete} alt="delete-icon" className="w-[100px] h-[100px]"/>
                            </div>
                            <h2 className="text-4xl font-semibold text-black mb-2">Are you sure?</h2>
                            <p className="text-gray-500 mb-6 font-[300]">
                                Are you sure to want to logout?
                            </p>

                            <div className="flex justify-center gap-6">
                                <button
                                onClick={async () => {
                                    console.log('User logged out');

                                    await logoutAdmin();
                                    setShowLogoutModal(false);
                                    navigate("/login");
                                }}
                                className="bg-[#2c6c50] hover:bg-[#d2f34c] hover:text-[#244034] transition-colors duration-300 text-white px-8 py-2 rounded-lg text-lg font-[500]">
                                    Yes
                                </button>
                                <button onClick={() => setShowLogoutModal(false)} className="text-[#2c6c50] hover:underline font-[500] text-lg">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/** main */}
            <div className="main bg-[#f0f5f3] min-h-full h-full w-full ml-[350px] overflow-y-scroll">
                <div className="nav-main bg-[#f0f5f3] w-full h-[90px] flex items-center justify-end gap-4 z-[9]">
                    <img src={menuopen} alt="open-menu" className="mr-auto w-[30px] h-[30px] cursor-pointer flex lg:hidden" onClick={toggleSidebar} />
                    <GlobalSearch />
                    <button className="nav-notification relative cursor-pointer" onClick={() => setIsnotification(!isnotification)}>
                        <img src={notification} alt="notification-icon" className="h-[25px] w-[25px]"/>
                        <div className="badge-pill"></div>
                        <div className={`absolute left-[-150px] top-[40px] text-start mt-2 w-[250px] bg-white rounded-xl shadow-md p-5 space-y-4 z-10 transition-all duration-300 ease-in-out ${isnotification ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                            <h3 className="font-semibold text-xl">Notification</h3>
                            <ul className="list-none space-y-2">
                                <li className="flex items-start relative notification-item">
                                    <img src={notification1} alt="notification-icon" className="w-10 h-10"/>
                                    <div className="ps-2">
                                        <h6 className="text-md text-black font-[500]">You have new mail</h6>
                                        <span className="text-sm text-gray-500 font-[300]">3 hours ago</span>
                                    </div>
                                    <div className="badge-pill" style={{ top: '8px' }}></div>
                                </li>

                                <li className="flex items-start relative notification-item">
                                    <img src={notification2} alt="notification-icon" className="w-10 h-10"/>
                                    <div className="ps-2">
                                        <h6 className="text-md text-black font-[500]">You have new mail</h6>
                                        <span className="text-sm text-gray-500 font-[300]">6 hours ago</span>
                                    </div>
                                    <div className="badge-pill" style={{ top: '8px' }}></div>
                                </li>

                                <li className="flex items-start relative notification-item">
                                    <img src={notification3} alt="notification-icon" className="w-10 h-10"/>
                                    <div className="ps-2">
                                        <h6 className="text-md text-black font-[500]">You have new mail</h6>
                                        <span className="text-sm text-gray-500 font-[300]">8 hours ago</span>
                                    </div>
                                    <div className="badge-pill" style={{ top: '8px' }}></div>
                                </li>
                            </ul>
                        </div>
                    </button>
                    <Link to='Pages/Complaints' className="bg-[#3f634d] text-white hover:bg-[#d2f34c] hover:text-[#244034] py-3 px-6 text-md font-[500] rounded-full transition-all duration-300" type='button' onClick={() => setActiveItem('Complaints')}>View Complaints</Link>
                </div>
                <div className="content w-full flex flex-col justify-between min-h-full ">
                    <Outlet />
                </div>
            </div>
        </div>
        </>
    )
}

export default Dashboard;