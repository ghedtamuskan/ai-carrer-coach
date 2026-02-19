import React from 'react'
import { getResume } from '../../../actions/resume'
import ResumeBuilder from './_components/resume-builder'

const ResumePage = () => {
  const resume = getResume()
  return (
    <div className=' container mx-auto py-6 '>
        <ResumeBuilder initialContent={resume?.content}/>

    </div>
  )
}
export default ResumePage