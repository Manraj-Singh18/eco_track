 import { Routes, Route } from 'react-router-dom';
 import Dashboard from './Dashboard/Dashboard';
 import Maincontent from './Dashboard/Maincontent';

 import AccountSettings from './Dashboard/Pages/AccountSettings';
 import Complaints from './Dashboard/Pages/Complaints';
 import MyProfile from './Dashboard/Pages/MyProfile';
 import Tasks from './Dashboard/Pages/Tasks';

 import Login from './Login';
 import ProtectedRoute from './ProtectedRoute';

 function App() {
   return (
     <Routes>

       <Route path="/login" element={<Login />} />

       <Route element={<ProtectedRoute />}>
         <Route path="/" element={<Dashboard />}>
           <Route index element={<Maincontent />} />
           <Route path='Pages/AccountSettings' element={<AccountSettings />} />
           <Route path='Pages/Complaints' element={<Complaints />} />
           <Route path='Pages/MyProfile' element={<MyProfile />} />
           <Route path='Pages/Tasks' element={<Tasks />} />
         </Route>
       </Route>

     </Routes>
   );
}

export default App;