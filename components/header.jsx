
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ChevronDown, GraduationCap, LayoutDashboard, FileText , PenBox, StarsIcon } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
 

const Header =() => {
  // Sync user to DB when possible, but never block rendering if env/config isn't ready.

  return (
    <header className="fixed top-0 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
  <nav className="w-full mx-auto px-4 h-16 py-2 flex items-center justify-between">
    <Link href="/">
        <Image src="/logo.png" alt="Sensai logo" width={60} height={100} className="h-12 py-1 w-auto object-contain"/>

    </Link>
    <div className="flex items-center space-x-2 md:space-x-4">
       <SignedIn>
       <Button variant="outline" asChild>
  <Link href="/dashboard">
    <LayoutDashboard className="h-4 w-4" />
    <span className="hidden md:block">Industry Insights</span>
  </Link>
</Button>

  
       <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button >
            <StarsIcon className="h-4 w-4"/>
            <span className="hidden md:block">Growth Tools</span>
            <ChevronDown className ="h-4 w-4"/>
            
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          bg-background
          text-foreground
          border
          shadow-lg
          rounded-xl
          w-52
        ">
        <DropdownMenuItem>
                <Link href={"/resume"} className= "flex items-center gap-2">
                <FileText className= "h-4 w-4"/>
                <span>Build Resume</span>
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem>
                <Link href={"/ai-cover-letter"} className= "flex items-center gap-2">
                <PenBox className= "h-4 w-4"/>
                <span>Cover Letter</span>
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem>
                <Link href={"/interview"} className= "flex items-center gap-2">
                <GraduationCap className= "h-4 w-4"/>
                <span>Interview Prep</span>
                </Link>
            </DropdownMenuItem>
           </DropdownMenuContent>
           </DropdownMenu>
           </SignedIn>
    
           <SignedOut>
    <SignInButton >
    <Button variant="outline">Sign In</Button>
    </SignInButton>

    </SignedOut>
    <SignedIn>
    <UserButton
  appearance={{
    elements: {
      avatarBox: "w-10 h-10 rounded-full overflow-hidden",
      userButtonPopoverCard: "shadow-xl border",
      userPreviewMainIdentifier: "font-semibold",
    },
  }}
  afterSignOutUrl="/"
/>

    </SignedIn>
        
    </div>
  </nav> 
    </header>
  )
}

export default Header