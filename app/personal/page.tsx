import AppPersonalPage from "./AppPersonalPage";
import { headers } from "next/headers";

export default async function PersonalPage() {
    const xTestDb = (await headers()).get('x-test-db') || undefined;
    return <AppPersonalPage xTestDb={xTestDb} />;
}