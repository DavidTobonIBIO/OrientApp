import { LocationContext } from "@/context/LocationContext";
import React, { useContext } from "react";
import { View, Text } from "react-native";

const EasyGuide = () => {
  const { locationInfo } = useContext(LocationContext);

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>OrientaFacil</Text>
      {locationInfo ? (
        <>
          <Text style={{ marginTop: 16 }}>
            Latitude: {locationInfo.latitude}
          </Text>
          <Text>Longitude: {locationInfo.longitude}</Text>
          {locationInfo.address ? (
            <Text style={{ marginTop: 8 }}>
              Address:{" "}
              {[
                locationInfo.address.street,
                locationInfo.address.city,
                locationInfo.address.region,
                locationInfo.address.postalCode,
                locationInfo.address.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
          ) : (
            <Text style={{ marginTop: 8 }}>
              Reverse geocode data not available.
            </Text>
          )}
        </>
      ) : (
        <Text style={{ marginTop: 16 }}>Loading location data...</Text>
      )}
    </View>
  );
};

export default EasyGuide;
