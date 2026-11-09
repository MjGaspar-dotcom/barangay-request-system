import api from "./api";

export async function getDocumentRequestTrends(params, signal) {
    const response = await api.get("/admin/analytics/document-request-trends", {
        params,
        signal,
    });
    const data = response.data?.data;

    if (
        response.data?.success !== true ||
        !Array.isArray(data?.points) ||
        !data?.summary
    ) {
        throw new Error("Unexpected document request trends response.");
    }

    return data;
}
