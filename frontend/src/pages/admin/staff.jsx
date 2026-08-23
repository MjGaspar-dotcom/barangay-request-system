
import { useEffect, useState } from "react";
import api from "../../services/api";

function Staff() {
    // Stores the staff records returned by the Laravel API.
    const [staff, setStaff] = useState([]);

    // Controls the loading state while fetching staff.
    const [loading, setLoading] = useState(true);

    // Stores an error message if the API request fails.
    const [error, setError] = useState("");

    // Stores the values entered into the Create Staff form.
    // These fields represent the basic information that will
    // eventually be stored in the users table.
    const [form, setForm] = useState({
        username: "",
        password: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        birth_date: "",
        gender: "",
        civil_status: "",
        address: "",
        contact_number: "",
        email: "",
    });

    // Fetch staff records when the Admin opens this page.
    useEffect(() => {
        fetchStaff();
    }, []);

    // Gets the existing staff from the Laravel API.
    const fetchStaff = async () => {
        try {
            const response = await api.get("/staff");

            setStaff(response.data.data);
        } catch (error) {
            console.error("Failed to load staff:", error);
            setError("Failed to load staff.");
        } finally {
            setLoading(false);
        }
    };

    // Updates the corresponding form field whenever
    // the Admin types into an input.
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    };

    // Frontend-only for now.
    // The backend endpoint for creating Staff has not
    // been implemented yet, so we only display the data.
    const handleSubmit = (event) => {
        event.preventDefault();

        console.log("Staff form submitted:", form);

        alert(
            "Staff information captured. Backend creation will be connected later."
        );
    };

    if (loading) {
        return <div>Loading staff...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Manage Staff</h1>

            {/* 
                CREATE STAFF FORM

                This form currently collects the information only.
                It does NOT create a database record yet.

                Later:
                Admin submits this form
                    ↓
                Laravel creates the User
                    ↓
                Laravel creates the Staff record
                    ↓
                assigned_by = logged-in Admin
            */}
            <h2>Create Staff</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>First Name</label>
                    <input
                        type="text"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Middle Name</label>
                    <input
                        type="text"
                        name="middle_name"
                        value={form.middle_name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Last Name</label>
                    <input
                        type="text"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Birth Date</label>
                    <input
                        type="date"
                        name="birth_date"
                        value={form.birth_date}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Gender</label>
                    <input
                        type="text"
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Civil Status</label>
                    <input
                        type="text"
                        name="civil_status"
                        value={form.civil_status}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Address</label>
                    <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Contact Number</label>
                    <input
                        type="text"
                        name="contact_number"
                        value={form.contact_number}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">
                    Create Staff
                </button>
            </form>

            <hr />

            {/* 
                STAFF LIST

                This part is already connected to:
                    Staff.jsx
                        ↓
                    api.get("/staff")
                        ↓
                    StaffController@index
                        ↓
                    Staff model
                        ↓
                    users + staff tables
            */}
            <h2>Staff List</h2>

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

