import GuestRequestForm from "../../components/forms/GuestRequestForm";

export default function Request() {
    return (
        <div className="container py-5">

            <h1 className="fw-bold text-center mb-4">
                Request Barangay Document
            </h1>

            <GuestRequestForm />

        </div>
    );
}