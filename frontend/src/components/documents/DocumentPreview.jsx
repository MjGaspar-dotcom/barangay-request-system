import { documentTemplateRegistry } from "./utils/documentTemplateRegistry";
import "./DocumentPreview.css";

export default function DocumentPreview({ document }) {
    const Template =
        documentTemplateRegistry[document.template_identifier];

    if (!Template) {
        return (
            <div className="app-alert app-alert-danger" role="alert">
                The saved document template is not available in this version.
            </div>
        );
    }

    return (
        <div className="document-preview-canvas">
            <Template document={document} />
        </div>
    );
}
