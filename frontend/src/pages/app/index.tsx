import { MessageSquare } from "lucide-react";
import PlaceholderPage from "@/components/PlaceholderPage";

export { default as Dashboard } from "./Dashboard";
export { default as Registration } from "./Registration";
export { default as Patients } from "./Patients";
export { default as Reports } from "./Reports";
export { default as Templates } from "./Templates";
export { default as ReportsBoard } from "./ReportsBoard";
export const Chat = () => (
  <PlaceholderPage title="IA Assistente" description="Apoio clínico conversacional." icon={MessageSquare} />
);
