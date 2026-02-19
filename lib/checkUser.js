
import {currentUser} from "@clerk/nextjs/server"
import { db } from "./prisma"


export const checkUser= async ()=>{
    let user = null;

    try {
        user = await currentUser();
    } catch (error) {
        // If Clerk isn't configured yet (missing keys, etc.), don't crash the whole
        // Server Component tree; just treat as signed out.
        // ClerkAPIResponseError can occur if keys are missing or invalid
        if (error instanceof Error) {
            console.error("checkUser: failed to read Clerk currentUser()", error.message);
        } else {
            console.error("checkUser: failed to read Clerk currentUser()", error);
        }
        return null;
    }

    if (!user){
        return null;
    }

    if (!db) {
        // DATABASE_URL not configured; allow app to render without DB-backed user.
        console.warn("checkUser: DATABASE_URL not set; skipping user sync");
        return null;
    }

    try {
    const loggedInUser= await db.user.findUnique({
            where:{
              clerkUserId:user.id,
            }
        })


    if  (loggedInUser){
        return loggedInUser;
    }  
    
    // Safely construct name, handling null/undefined values
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || user.username || 'User';

    // Safely get email, handling empty array
    const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '';

    const newUser= await db.user.create({
        data:{
          clerkUserId:user.id,
          name,
          imageUrl:user.imageUrl || null,
          email:email,
        }
    })

    return newUser;
    } catch(error){
    console.error("checkUser: failed to sync user to DB", error);
    return null;
    }
}