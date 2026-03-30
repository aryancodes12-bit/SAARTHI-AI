import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'



export default function CustomerLayout() {

  return (

    <div className="flex h-screen overflow-hidden bg-gray-50">

      <Sidebar />

      <main className="flex-1 overflow-x-hidden overflow-y-auto relative">

        <Outlet />

      </main>

    </div>

  )

}