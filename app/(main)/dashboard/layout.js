import React ,{Suspense}from 'react'
import {BarLoader} from "react-spinners"

const Layout = ({children})=>{
    return(
        <div className="container mx-auto px-5 mt-10">
            <div className="flex items-center justify-between mb-5  ">
      <h1 className='text-6xl font-bold gradient-title -mt-6'> Industry Insights 
        </h1> 
        </div>
        <Suspense fallback={<BarLoader className='mt-4' width={"100%"} color="gray"/> } >
             {children}

        </Suspense>
          
           </div>
    )
}
export default Layout