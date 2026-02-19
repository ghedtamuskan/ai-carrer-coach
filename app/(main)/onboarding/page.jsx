import { redirect } from "next/navigation";
import { industries } from "@/data/industries";
import { getUserOnboardingStatus } from "@/actions/user";
import OnboardingForm from "./_components/onboarding-form";

const OnboardingPage=async()=> {
 

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  );
}

export default OnboardingPage;

