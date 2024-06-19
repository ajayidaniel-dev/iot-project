import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import TextBold from "../styled/TextBold";
import TextRegular from "../styled/Text";

const Dashboard = () => {
  const [lastTemperature, setLastTemperature] = useState(null);
  const [lastHumidity, setLastHumidity] = useState(null);
  const [lastTime, setLastTime] = useState(null);
  const [dataValues, setDataValues] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

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

  useEffect(() => {
    const fetchDataFromStorage = async () => {
      try {
        // Retrieve existing data from AsyncStorage
        const storedData = await AsyncStorage.getItem("new-data");

        if (storedData) {
          const existingData = JSON.parse(storedData);
          if (existingData.length > 0) {
            // Get the last object from the data
            existingData.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
            const lastData = existingData[existingData.length - 1];
            // Set last temperature and humidity
            setDataValues(existingData);
            setLastTime(lastData.timestamp);
            setLastTemperature(lastData.temperature);
            setLastHumidity(lastData.humidity);
          } else {
            // If no data in AsyncStorage, set last temperature and humidity to null
            setLastTemperature(null);
            setLastHumidity(null);
            setLastTime(null);
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
            setDataValues(updatedData);

            // Save updated data to AsyncStorage
            await AsyncStorage.setItem("new-data", JSON.stringify(updatedData));

            // Update last temperature
            setLastTemperature(newData.temperature);
            setLastHumidity(newData.humidity); // Assuming the temperature key is 'temperature'
            setLastTime(newData.timestamp);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon";
    } else if (hour >= 17 && hour < 20) {
      return "Good evening";
    } else {
      return "Good night";
    }
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

  return (
    <SafeAreaView className="w-full bg-[#f5dbdb] flex-1 pt-10">
      <StatusBar style="auto" backgroundColor="#f5dbdb" />
      <View className="flex relative  flex-row px-8 justify-between items-center w-full">
        <TextBold className=" text-[32px] text-black">Hello 👋</TextBold>
        <View className="">
          <Pressable onPress={() => setModalVisible(true)}>
            <Entypo name="dots-three-vertical" size={24} color="black" />
          </Pressable>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <Pressable
                onPress={() => setModalVisible(false)}
                className="w-full flex flex-row justify-end items-center mr-40 mb-10"
              >
                <FontAwesome name="times" size={40} color="white" />
              </Pressable>
              <View
                style={{
                  backgroundColor: "white",
                  padding: 20,
                  borderRadius: 10,
                  width: "60%",
                }}
              >
                <Link href="/graph">
                  <TextRegular className="text-[20px] ">View graph</TextRegular>
                </Link>
              </View>
              <View className="rounded-[10px] w-[60%] bg-white p-[20px] mt-4">
                <Link href="/group">
                  <TextRegular className="text-[20px] ">
                    View Daily readings
                  </TextRegular>
                </Link>
              </View>
            </View>
          </Modal>
        </View>
      </View>
      <View className="px-8">
        <TextRegular className=" mt-6 text-[20px]  text-black">
          {getGreeting()}
        </TextRegular>
        <TextRegular className=" text-[16px] italic w-full mt-8 mb-2 text-[#000000] ">
          Temperature and relative humidity values update every 3 minutes
        </TextRegular>
        <TextRegular className=" text-[24px] underline  w-full  mt-4 text-[#000E58] ">
          Latest readings
        </TextRegular>
        {dataValues.length >= 1 ? (
          <View>
            <View className="w-full bg-[#fafafa] rounded-xl flex flex-row justify-start items-start shadow-xl shadow-black p-6 mt-6">
              <View className="p-8 rounded-full bg-[#8aa29e] mr-8 text-[24px] flex justify-center items-center">
                <FontAwesome5 name="temperature-high" size={40} color="black" />
              </View>
              <View className="w-[35%]">
                <TextRegular className=" text-[12px] mb-2 text-[#8aa29e] ">
                  Temperature
                </TextRegular>

                <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                  {`${lastTemperature ? lastTemperature.toFixed(1) : 0}°C`}
                </TextRegular>
                <TextRegular className=" text-[16px] text-black">
                  {formatDate(lastTime)}
                </TextRegular>
                <TextRegular className=" text-[16px] text-black">
                  {formatTime(lastTime)}
                </TextRegular>
              </View>
              <View className="w-1/3">
                <TextRegular className=" text-[12px]  text-[#8aa29e] ">
                  Temperature Humidity
                </TextRegular>
                <TextRegular className=" text-[12px] mb-2 text-[#8aa29e] ">
                  Index (THI)
                </TextRegular>

                <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                  {`${
                    lastTemperature
                      ? (
                          0.85 * lastTemperature +
                          0.15 * calculateWetBulb(lastTemperature, lastHumidity)
                        ).toFixed(1)
                      : 0
                  }°C`}
                </TextRegular>
              </View>
            </View>
            <View className="w-full bg-[#fafafa] rounded-xl flex flex-row justify-start items-start g shadow-xl shadow-black p-6 mt-12">
              <View className="p-8 rounded-full bg-[#b6be9c] mr-8 text-[24px] flex justify-center items-center">
                <MaterialCommunityIcons
                  name="air-humidifier"
                  size={40}
                  color="black"
                />
              </View>
              <View className="w-[35%]">
                <TextRegular className=" text-[14px] mb-2 text-[#b6be9c]">
                  Relative humidity
                </TextRegular>

                <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                  {`${lastHumidity ? lastHumidity.toFixed(1) : 0}%`}
                </TextRegular>
                <TextRegular className=" text-[16px] text-black">
                  {formatDate(lastTime)}
                </TextRegular>
                <TextRegular className=" text-[16px] text-black">
                  {formatTime(lastTime)}
                </TextRegular>
              </View>
              <View className="w-1/3">
                <TextRegular className=" text-[12px]  text-[#8aa29e] ">
                  Temperature Humidity
                </TextRegular>
                <TextRegular className=" text-[12px] mb-2 text-[#8aa29e] ">
                  Index (THI)
                </TextRegular>

                <TextRegular className="font-extraboldbold text-[36px] text-[#000000]">
                  {`${
                    lastTemperature
                      ? (
                          0.85 * lastTemperature +
                          0.15 * calculateWetBulb(lastTemperature, lastHumidity)
                        ).toFixed(1)
                      : 0
                  }°C`}
                </TextRegular>
              </View>
            </View>
          </View>
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

        <View className="w-full flex flex-row mt-10 mb-2 justify-between items-center">
          <TextRegular className=" text-[24px] underline  w-2/5  text-[#000E58] ">
            Recent readings
          </TextRegular>
          <Pressable
            onPress={() => router.push("/readings")}
            className=" px-4 rounded-xl py-3 flex  flex-row justify-center  items-center  bg-[#000E58]"
          >
            <TextRegular className="  text-[#FFEFEF]  text-[20px]">
              View more
            </TextRegular>
          </Pressable>
        </View>
        {dataValues.length >= 1 ? (
          <FlatList
            data={dataValues
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 10)}
            className=" h-[300px] rounded-xl pb-20"
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

export default Dashboard;
