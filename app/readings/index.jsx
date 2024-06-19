import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TextRegular from "../../components/styled/Text";
import TextBold from "../../components/styled/TextBold";

const Readings = () => {
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

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let period = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12; // Convert hours to 12-hour format

    // Add leading zero for single-digit minutes
    minutes = minutes < 10 ? "0" + minutes : minutes;

    return `${hours}:${minutes}${period}`;
  };

  const calculateWetBulb = (tdb, hum) => {
    const dbTemp = tdb;
    const rh = hum / 100;

    if (isNaN(dbTemp) || isNaN(rh)) {
      alert(
        "Please enter valid numbers for dry bulb temperature and relative humidity."
      );
      return;
    }

    const wbTemp =
      dbTemp * Math.atan(0.151977 * Math.sqrt(rh) + 0.944) +
      Math.atan(dbTemp + 0.148772 * Math.pow(rh, 0.5)) -
      Math.atan(0.148772 * Math.pow(rh, 0.5)) +
      6.09;

    return wbTemp.toFixed(2); // Round to 2 decimal places
  };

  useEffect(() => {
    const fetchDataFromStorage = async () => {
      try {
        // Retrieve existing data from AsyncStorage
        const storedData = await AsyncStorage.getItem("new-data");

        if (storedData) {
          const existingData = JSON.parse(storedData);
          if (existingData.length > 0) {
            // Sort existing data by timestamp
            existingData.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Set last temperature and humidity
            setDataValues(existingData);
          } else {
            // If no data in AsyncStorage, set last temperature and humidity to null
            setDataValues([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data from AsyncStorage:", error);
      }
    };

    const connectWebSocket = () => {
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

            // Sort updated data by timestamp
            updatedData.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Save updated data to AsyncStorage
            await AsyncStorage.setItem("new-data", JSON.stringify(updatedData));

            // Set last temperature and humidity
            setDataValues(updatedData);

            console.log("Data stored:", updatedData);
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
    connectWebSocket();
  }, []);

  return (
    <SafeAreaView className="w-full bg-[#f5dbdb] flex-1 ">
      <StatusBar style="auto" backgroundColor="#f5dbdb" />
      <View className="px-8">
        <TextBold className=" text-[24px] underline mb-4  w-full   text-[#000E58] ">
          All readings
        </TextBold>
        {dataValues.length >= 1 ? (
          <FlatList
            data={dataValues.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )}
            className=" h-[850px] rounded-xl  "
            renderItem={({ item }) => (
              <View className="w-full bg-[#fafafa] rounded-xl   shadow-black p-6 mt-6">
                <TextRegular className=" text-[20px] mb-6 text-[#000000] w-full">
                  {formatDate(item.timestamp)} || {formatTime(item.timestamp)}
                </TextRegular>
                <View className="w-full  flex flex-row justify-center items-center">
                  <View className="w-1/3 ml-6">
                    <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                      Temperature:
                    </TextRegular>

                    <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                      {`${item.temperature.toFixed(1)}°C`}
                    </TextRegular>
                  </View>
                  <View className="w-1/3 ml-2">
                    <TextRegular className=" text-[16px] mb-2 text-[#000000]">
                      Relative humidity:
                    </TextRegular>

                    <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                      {`${item.humidity.toFixed(1)}%`}
                    </TextRegular>
                  </View>
                  <View className="w-1/3 ml-2">
                    <TextRegular className=" text-[18px] mb-2 text-[#000000]">
                      THI
                    </TextRegular>

                    <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                      {`${
                        item.temperature
                          ? (
                              0.85 * item.temperature +
                              0.15 *
                                calculateWetBulb(
                                  item.temperature,
                                  item.humidity
                                )
                            ).toFixed(1)
                          : 0
                      }°C`}
                    </TextRegular>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={() => generateRandomKey(20)}
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
      </View>
    </SafeAreaView>
  );
};

export default Readings;
