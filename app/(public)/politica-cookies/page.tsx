import LegalDocumentPage from "@/components/ui/LegalDocumentPage";
import { cookiesPolicy } from "../legalDocuments";

export default function PoliticaCookiesPage() {
  return <LegalDocumentPage {...cookiesPolicy} />;
}
