import { philippines } from "@ianlabicani/geoph-lite";

export const getRegions = () => {
    return philippines.regions();
};

export const getProvinces = async (regionCode) => {
    if (!regionCode) {
        return [];
    }

    return await philippines.provinces(regionCode);
};

export const getCitiesMunicipalities = async (parentCode) => {
    if (!parentCode) {
        return [];
    }

    return await philippines.localities(parentCode);
};

export const getBarangays = async (localityCode) => {
    if (!localityCode) {
        return [];
    }

    return await philippines.barangays(localityCode);
};

export const buildAddress = ({ barangay, cityMunicipality, province }) => {
    return [barangay, cityMunicipality, province].filter(Boolean).join(", ");
};
