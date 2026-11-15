import BarangayClearanceTemplate from "../templates/BarangayClearanceTemplate";
import CertificateOfResidencyTemplate from "../templates/CertificateOfResidencyTemplate";
import CertificateOfIndigencyTemplate from "../templates/CertificateOfIndigencyTemplate";
import StandardCertificateTemplate from "../templates/StandardCertificateTemplate";

export const documentTemplateRegistry = Object.freeze({
    barangay_clearance: BarangayClearanceTemplate,
    certificate_of_residency: CertificateOfResidencyTemplate,
    certificate_of_indigency: CertificateOfIndigencyTemplate,
    barangay_business_clearance: StandardCertificateTemplate,
    certificate_of_first_time_job_seeker: StandardCertificateTemplate,
    certificate_of_good_moral_character: StandardCertificateTemplate,
    certificate_of_low_income: StandardCertificateTemplate,
    certificate_of_no_income: StandardCertificateTemplate,
    certificate_of_unemployment: StandardCertificateTemplate,
    certificate_of_actual_residency: StandardCertificateTemplate,
    certificate_of_solo_parent: StandardCertificateTemplate,
    certificate_of_family_composition: StandardCertificateTemplate,
    certificate_of_appearance: StandardCertificateTemplate,
    certificate_of_blotter: StandardCertificateTemplate,
    certificate_of_no_pending_complaint: StandardCertificateTemplate,
    custom_barangay_document: StandardCertificateTemplate,
});

const templateIdentifiersByName = Object.freeze({
    "barangay clearance": "barangay_clearance",
    "certificate of residency": "certificate_of_residency",
    "certificate of indigency": "certificate_of_indigency",
    "barangay business clearance": "barangay_business_clearance",
    "certificate of first-time job seeker":
        "certificate_of_first_time_job_seeker",
    "first-time job seeker certificate":
        "certificate_of_first_time_job_seeker",
    "certificate of good moral character":
        "certificate_of_good_moral_character",
    "certificate of low income": "certificate_of_low_income",
    "certificate of no income": "certificate_of_no_income",
    "certificate of unemployment": "certificate_of_unemployment",
    "certificate of actual residency": "certificate_of_actual_residency",
    "certificate of solo parent": "certificate_of_solo_parent",
    "certificate of family composition": "certificate_of_family_composition",
    "certificate of appearance": "certificate_of_appearance",
    "certificate of blotter": "certificate_of_blotter",
    "certificate of no pending complaint":
        "certificate_of_no_pending_complaint",
});

export function documentTemplateIdentifierForType(documentName) {
    const key = String(documentName || "").trim().toLowerCase();
    return templateIdentifiersByName[key] || "custom_barangay_document";
}
