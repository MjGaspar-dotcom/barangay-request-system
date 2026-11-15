import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import DocumentPreview from "../../components/documents/DocumentPreview";
import "./request-processing.css";

export default function GeneratedDocumentPage() {
    const { requestId } = useParams();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const Layout = isAdmin ? AdminLayout : StaffLayout;
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get(`/barangay-requests/${requestId}/generated-document`)
            .then((response) => {
                if (!active) return;
                setDocument(response.data.data.document);
            })
            .catch((requestError) => {
                console.error(requestError);
                if (!active) return;
                setError(
                    requestError.response?.data?.message ||
                        "The generated document could not be loaded.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [requestId]);

    if (loading) {
        return (
            <Layout>
                <SkeletonLoader label="Loading generated document" variant="detail" />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="admin-dashboard generated-document-page">
                <div className="w-full">
                    {document ? (
                        <DocumentPreview document={document} />
                    ) : (
                        <div className="app-alert app-alert-danger" role="alert">
                            {error || "No generated document is available."}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
