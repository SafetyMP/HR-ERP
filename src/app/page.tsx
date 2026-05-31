import { HomeLandingClient } from "./home-landing-client";
import { HomeDevFooter } from "./home-dev-footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <HomeLandingClient />
      <HomeDevFooter />
    </div>
  );
}
