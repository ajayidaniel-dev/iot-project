import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TextRegular from "../../components/styled/Text";
import TextBold from "../../components/styled/TextBold";

const Group = () => {
  const [dataValues, setDataValues] = useState([]);

  const generateRandomKey = (length) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };
  useEffect(() => {
    const fetchDataFromStorage = async () => {
      try {
        // Retrieve existing data from AsyncStorage
        const storedData = await AsyncStorage.getItem("new-data");

        if (storedData) {
          const existingData = JSON.parse(storedData);
          if (existingData.length > 0) {
            const grouped = existingData.reduce((acc, item) => {
              const date = item.timestamp.split("T")[0];
              if (!acc[date]) {
                acc[date] = [];
              }
              acc[date].push(item);
              return acc;
            }, {});
            const formattedData = Object.keys(grouped).map((date) => {
              const values = grouped[date];
              const temperatures = values.map((item) => item.temperature);
              const humidities = values.map((item) => item.humidity);
              return {
                date,
                maxTemperature: Math.max(...temperatures),
                minTemperature: Math.min(...temperatures),
                avgTemperature:
                  temperatures.reduce((acc, curr) => acc + curr, 0) /
                  temperatures.length,
                maxHumidity: Math.max(...humidities),
                minHumidity: Math.min(...humidities),
                avgHumidity:
                  humidities.reduce((acc, curr) => acc + curr, 0) /
                  humidities.length,
              };
            });
            setDataValues(formattedData);
          } else {
            // If no data in AsyncStorage, set last temperature and humidity to null
            setDataValues([]);
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

            // Save updated data to AsyncStorage
            await AsyncStorage.setItem("new-data", JSON.stringify(updatedData));

            // Group and calculate data
            const grouped = updatedData.reduce((acc, item) => {
              const date = item.timestamp.split("T")[0];
              if (!acc[date]) {
                acc[date] = [];
              }
              acc[date].push(item);
              return acc;
            }, {});
            const formattedData = Object.keys(grouped).map((date) => {
              const values = grouped[date];
              const temperatures = values.map((item) => item.temperature);
              const humidities = values.map((item) => item.humidity);
              return {
                date,
                maxTemperature: Math.max(...temperatures),
                minTemperature: Math.min(...temperatures),
                avgTemperature:
                  temperatures.reduce((acc, curr) => acc + curr, 0) /
                  temperatures.length,
                maxHumidity: Math.max(...humidities),
                minHumidity: Math.min(...humidities),
                avgHumidity:
                  humidities.reduce((acc, curr) => acc + curr, 0) /
                  humidities.length,
              };
            });

            setDataValues(formattedData);
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

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      // Today's date
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      // Yesterday's date
      return "Yesterday";
    } else {
      // Any other date
      // Define arrays for day and month names
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Get day, month, and date
      const dayName = days[date.getUTCDay()];
      const monthName = months[date.getUTCMonth()];
      const dateNumber = date.getUTCDate();

      // Add suffix to the date number
      let suffix = "th";
      if (dateNumber === 1 || dateNumber === 21 || dateNumber === 31) {
        suffix = "st";
      } else if (dateNumber === 2 || dateNumber === 22) {
        suffix = "nd";
      } else if (dateNumber === 3 || dateNumber === 23) {
        suffix = "rd";
      }

      // Construct formatted date string
      const formattedDate = `${dayName}, ${monthName} ${dateNumber}${suffix}`;

      return formattedDate;
    }
  };

  return (
    <SafeAreaView className="w-full bg-[#f5dbdb] flex-1 ">
      <StatusBar style="auto" backgroundColor="#f5dbdb" />
      <View className="px-8">
        <TextBold className=" text-[30px] underline mb-4  w-full   text-[#000E58] ">
          Daily readings
        </TextBold>
      </View>
      {dataValues.length >= 1 ? (
        <FlatList
          data={dataValues}
          className="px-6"
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View className="w-full bg-[#fafafa] mt-6 shadow p-6 rounded-xl">
              <TextRegular className=" text-[20px] mb-6 text-[#000000] w-full">
                {formatDate(item.date)}
              </TextRegular>
              <View className="w-full  flex flex-row justify-center items-center">
                <View className="w-1/2 ">
                  <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                    Maximum Temperature:
                  </TextRegular>

                  <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                    {`${item.maxTemperature.toFixed(1)}°C`}
                  </TextRegular>
                  <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                    Minimum Temperature:
                  </TextRegular>

                  <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                    {`${item.minTemperature.toFixed(1)}°C`}
                  </TextRegular>
                  <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                    Average Temperature:
                  </TextRegular>

                  <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                    {`${item.avgTemperature.toFixed(1)}°C`}
                  </TextRegular>
                </View>
                <View className="w-1/2 ">
                  <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                    Maximum Humidity:
                  </TextRegular>

                  <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                    {`${item.maxHumidity.toFixed(1)}%`}
                  </TextRegular>
                  <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                    Minimum Humidity:
                  </TextRegular>

                  <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                    {`${item.minHumidity.toFixed(1)}%`}
                  </TextRegular>
                  <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                    Average Humidity:
                  </TextRegular>

                  <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                    {`${item.avgHumidity.toFixed(1)}%`}
                  </TextRegular>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <View className="w-full bg-[#fafafa] rounded-xl   shadow-black p-6 mt-6">
          <TextBold className="text-[28px] text-black">
            There are no values logged yet!!!
          </TextBold>
          <TextRegular className="text-[18px] mt-4 text-black">
            Check your IoT sensor connection and try again.
          </TextRegular>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Group;
