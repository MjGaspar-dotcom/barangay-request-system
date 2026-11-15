import { formatDocumentDate } from "./utils/documentFormatters";

export default function DocumentResidentDetails({ resident }) {
    return (
        <dl className="document-resident-details">
            <div>
                <dt>Resident</dt>
                <dd>{resident.full_name}</dd>
            </div>
            <div>
                <dt>Date of birth</dt>
                <dd>{formatDocumentDate(resident.birth_date)}</dd>
            </div>
            <div>
                <dt>Age</dt>
                <dd>{resident.age}</dd>
            </div>
            <div>
                <dt>Civil status</dt>
                <dd>{resident.civil_status}</dd>
            </div>
            <div>
                <dt>Address</dt>
                <dd>{resident.address}</dd>
            </div>
        </dl>
    );
}
