import { useNavigate } from "react-router-dom";
import RoleCard from "../navigation/RoleCard";

function RoleSection() {
    const navigate = useNavigate();

    return (
        <section className="content-section role-section">
            <div className="container">
                <div className="section-heading">
                    <span className="section-label">SYSTEM ACCESS</span>

                    <h2>Choose Your Role</h2>

                    <p>
                        Select the appropriate portal based on how you use the
                        barangay document system.
                    </p>
                </div>

                <div className="row g-4 justify-content-center">
                    <div className="col-md-4">
                        <RoleCard
                            icon="👤"
                            title="Resident"
                            description="Request and track your barangay documents online."
                            onClick={() => navigate("/login")}
                        />
                    </div>

                    <div className="col-md-4">
                        <RoleCard
                            icon="🧑‍💼"
                            title="Barangay Staff"
                            description="Process, review, and manage submitted document requests."
                            onClick={() => navigate("/staff/login")}
                        />
                    </div>

                    <div className="col-md-4">
                        <RoleCard
                            icon="⚙️"
                            title="Administrator"
                            description="Manage users, staff, documents, and system operations."
                            onClick={() => navigate("/admin/login")}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default RoleSection;
