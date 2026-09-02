function RoleCard({ title, description, icon, onClick }) {
    return (
        <button type="button" className="role-card" onClick={onClick}>
            {icon && <div className="role-card-icon">{icon} </div>}

            <h3>{title}</h3>

            <p>{description}</p>

            <span className="role-card-action">Continue →</span>
        </button>
    );
}

export default RoleCard;
