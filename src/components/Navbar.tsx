'use client'

import {Button} from "@/components/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faMicrophone } from '@fortawesome/free-solid-svg-icons'
export default function Navbar() {
    return (
        <nav className="w-full border-b bg-white">
            <div className="flex justify-between items-center my-4 mx-6 lg:px-16">
                <div className="flex items-center justify-between">
                    <FontAwesomeIcon icon={faMicrophone} className="bg-[#30c2a1] text-white p-2 border rounded-lg mr-2"/>
                    <span className='font-bold text-sm md:text-lg'>Speech to Text Writing Tool</span>
                </div>
                <Button className='bg-[#30c2a1] hover:bg-[#28a88c]'>Download PDF</Button>
            </div>
        </nav>

    )
}