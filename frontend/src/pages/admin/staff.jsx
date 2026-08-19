import { useEffect, useState } from "react";
import api from "../../services/api";

function Staff() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await api.get("/staff");

                setStaff(response.data.data);
            } catch (error) {
                console.error(error);
                setError("Failed to load staff.");
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, []);

    if (loading) {
        return <div>Loading staff...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Manage Staff</h1>

            {staff.length === 0 ? (
                <p>No staff found.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Contact Number</th>
                        </tr>
                    </thead>

                    <tbody>
                        {staff.map((member) => (
                            <tr key={member.staff_id}>
                                <td>
                                    {member.user?.first_name}{" "}
                                    {member.user?.last_name}
                                </td>

                                <td>
                                    {member.user?.username}
                                </td>

                                <td>
                                    {member.user?.email}
                                </td>

                                <td>
                                    {member.user?.contact_number}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Staff;