import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TextBold from "../../components/styled/TextBold";
import { LineChart } from "react-native-gifted-charts";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TextRegular from "../../components/styled/Text";

const Graph = () => {
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = date.getUTCDate().toString().padStart(2, "0");
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = date.getUTCFullYear().toString().slice(-2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "pm" : "am";
    const formattedHour = (hours % 12 || 12).toString();
    return `${day}-${month}-${year}|${formattedHour}:${minutes}${period}`;
  };

  useEffect(() => {
    const fetchDataFromStorage = async () => {
      try {
        // Retrieve existing data from AsyncStorage
        const storedData = await AsyncStorage.getItem("new-data");

        if (storedData) {
          const existingData = JSON.parse(storedData);
          if (existingData.length > 0) {
            existingData.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
            // Extract temperature and humidity data with formatted date
            const temperatureData = existingData.map((item) => ({
              value: item.temperature,
              date: formatDate(item.timestamp), // Assuming formatDate function formats the date
            }));

            const humidityData = existingData.map((item) => ({
              value: item.humidity,
              date: formatDate(item.timestamp), // Assuming formatDate function formats the date
            }));

            // Set state with temperature and humidity data
            setTemperatureData(temperatureData);
            setHumidityData(humidityData);
          } else {
            // If no data in AsyncStorage, set temperature and humidity data to empty arrays
            setTemperatureData([]);
            setHumidityData([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data from AsyncStorage:", error);
      }
    };

    const connectWebServer = () => {
      const ws = new WebSocket("wss://my-iot-project.onrender.com/ws/sensor");

      ws.onopen = () => {
        console.log("WebSocket connection established.");
      };

      ws.onmessage = async (event) => {
        try {
          const eventData = JSON.parse(event.data); // Assuming data is JSON

          // Check if the received message contains new sensor data
          if (eventData.message === "new sensor data") {
            const newData = eventData.data;

            let existingData = [];

            // Retrieve existing data from AsyncStorage
            const storedData = await AsyncStorage.getItem("new-data");

            if (storedData) {
              existingData = JSON.parse(storedData);
            }

            // Merge new data with existing data
            const updatedData = [...existingData, newData];

            // Sort updatedData from oldest to newest
            updatedData.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Save updated data to AsyncStorage
            await AsyncStorage.setItem("new-data", JSON.stringify(updatedData));

            // Update last temperature
            const temperatureData = updatedData.map((item) => ({
              value: item.temperature,
              date: formatDate(item.timestamp), // Assuming formatDate function formats the date
            }));

            const humidityData = updatedData.map((item) => ({
              value: item.humidity,
              date: formatDate(item.timestamp), // Assuming formatDate function formats the date
            }));
            setTemperatureData(temperatureData);
            setHumidityData(humidityData);
          }
        } catch (error) {
          console.error("Error processing incoming message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed. Reconnecting...");
        // Attempt to reconnect after a short delay
        setTimeout(connectWebSocket, 1000); // Adjust delay as needed
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Close the current WebSocket connection
        ws.close();
      };

      return () => {
        ws.close();
      };
    };
    fetchDataFromStorage();
    connectWebServer();
  }, []);

  return (
    <ScrollView>
      <SafeAreaView className="w-full bg-[#f5dbdb] flex-1 pb-20">
        <StatusBar style="auto" backgroundColor="#f5dbdb" />
        <View className="px-8">
          <TextBold className="text-[32px] text-black underline">
            Graphs
          </TextBold>
        </View>
        <ScrollView horizontal={true}>
          <View className="w-full  py-10 relative bg-white mt-6">
            <TextBold className="text-[24px] text-black underline mt-4 pb-6">
              Temperature:
            </TextBold>
            <LineChart
              data={temperatureData}
              height={350}
              areaChart
              curved
              showVerticalLines
              spacing={40}
              initialSpacing={0}
              yAxisLabelSuffix="°C"
              color1="skyblue"
              color2="orange"
              textColor1="green"
              dataPointsColor1="brown"
              startFillColor1="skyblue"
              startOpacity={0.4}
              endOpacity={0.2}
              pointerConfig={{
                pointerStripUptoDataPoint: true,

                pointer1Color: "#000E58",
                pointerLabelComponent: (items) => {
                  return (
                    <View
                      style={{
                        height: 80,
                        width: 150,
                        backgroundColor: "#282C3E",
                        borderRadius: 4,
                        justifyContent: "center",
                        paddingLeft: 16,
                        position: "absolute",
                      }}
                    >
                      <TextRegular
                        style={{ color: "white" }}
                      >{`${items[0].value.toFixed(1)}°C`}</TextRegular>
                      <TextRegular
                        style={{ color: "white" }}
                      >{`${items[0].date}`}</TextRegular>
                    </View>
                  );
                },
              }}
            />
          </View>
        </ScrollView>
        <ScrollView horizontal={true}>
          <View className="w-full mt-20 py-6">
            <TextBold className="text-[24px] text-black underline mt-4 pb-6">
              Relative Humidity:
            </TextBold>

            <LineChart
              data={humidityData}
              height={350}
              showVerticalLines
              spacing={40}
              areaChart
              curved
              initialSpacing={0}
              color1="#000E58"
              textColor1="green"
              dataPointsColor1="brown"
              startFillColor1="#000E58"
              startOpacity={0.4}
              endOpacity={0.2}
              yAxisLabelSuffix="%"
              noOfSections={10}
              pointerConfig={{
                pointerStripUptoDataPoint: true,

                pointer1Color: "#000E58",
                pointerLabelComponent: (items) => {
                  return (
                    <View
                      style={{
                        height: 80,
                        width: 150,
                        backgroundColor: "#282C3E",
                        borderRadius: 4,
                        justifyContent: "center",
                        paddingLeft: 16,
                      }}
                    >
                      <TextRegular
                        style={{ color: "white" }}
                      >{`${items[0].value.toFixed(1)}%`}</TextRegular>
                      <TextRegular
                        style={{ color: "white" }}
                      >{`${items[0].date}`}</TextRegular>
                    </View>
                  );
                },
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScrollView>
  );
};

export default Graph;
