import LegalDocumentPage from "@/components/ui/LegalDocumentPage";
import { termsAndConditions } from "../legalDocuments";

export default function TerminosCondicionesPage() {
  return <LegalDocumentPage {...termsAndConditions} />;
}
