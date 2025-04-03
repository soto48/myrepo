#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <RTClib.h>
#include <LoRa.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_PN532.h>

// OLED onboard (gunakan default Wire, jangan ubah!)
#define SCREEN_ADDRESS 0x3C
#define OLED_SDA 18
#define OLED_SCL 17
Adafruit_SSD1306 display(128, 64, &Wire, -1);

// RTC DS3231 (gunakan Wire1)
RTC_DS3231 rtc;

// SD Card Pins
#define SD_CS 13
#define SD_MOSI 11
#define SD_MISO 2
#define SD_SCK 14
SPIClass spiSD(HSPI);

// LoRa pins
#define LORA_SS 7
#define LORA_RST 8
#define LORA_DIO0 33
#define LORA_MOSI 6
#define LORA_SCK 5
#define LORA_MISO 3

// RFID (PN532) gunakan Wire1
TwoWire myWire1 = TwoWire(1);
Adafruit_PN532 nfc(-1, -1, &myWire1);

// New I2C Peripheral (gunakan Wire1)
#define NEW_I2C_ADDRESS 0x3D // Update with the correct address found by the scanner

// Voltage input pin
#define VOLTAGE_PIN A0

// Mapping RFID UID ke Nama
struct RFIDName {
  String uid;
  String nama;
};

RFIDName dataRFID[] = {
  {"6e9e364e", "Pak Jito"},
  {"992f333", "Pak Jon"},
  {"83966214", "Pak Asop"}
};

String cariNama(String uid) {
  for (int i = 0; i < sizeof(dataRFID) / sizeof(dataRFID[0]); i++) {
    if (dataRFID[i].uid == uid) {
      return dataRFID[i].nama;
    }
  }
  return "Unknown";
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Program Start!");

  // Initialize Wire for OLED (GPIO18 SDA, GPIO17 SCL)
  Serial.println("Initializing OLED...");
  Wire.begin(OLED_SDA, OLED_SCL);
  Serial.println("Wire initialized");
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("OLED Failed!");
  } else {
    Serial.println("OLED Initialized!");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.println("Initializing...");
    display.display();
  }

  // RTC & PN532 gunakan Wire1 GPIO43 SDA, GPIO44 SCL
  Serial.println("Initializing Wire1...");
  myWire1.begin(43, 44);

  // RTC init
  Serial.println("Initializing RTC...");
  if (!rtc.begin(&myWire1)) {
    Serial.println("RTC Error!");
    display.println("RTC Error!");
    display.display();
  } else {
    Serial.println("RTC Initialized!");
  }

  // SD Card init
  Serial.println("Initializing SD Card...");
  spiSD.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, spiSD)) {
    Serial.println("SD Failed!");
    display.println("SD Failed!");
    display.display();
  } else {
    Serial.println("SD Card Initialized!");
  }

  // PN532 init
  Serial.println("Initializing PN532...");
  nfc.begin();
  if (!nfc.getFirmwareVersion()) {
    Serial.println("PN532 Failed!");
    display.println("PN532 Failed!");
    display.display();
  } else {
    Serial.println("PN532 Initialized!");
    nfc.SAMConfig();
  }

  // New I2C Peripheral init
  Serial.println("Initializing New I2C Peripheral...");
  myWire1.beginTransmission(NEW_I2C_ADDRESS);
  if (myWire1.endTransmission() != 0) {
    Serial.println("New I2C Peripheral Failed!");
    display.println("New I2C Peripheral Failed!");
    display.display();
  } else {
    Serial.println("New I2C Peripheral Initialized!");
  }

  // LoRa init
  Serial.println("Initializing LoRa...");
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(915E6)) {
    Serial.println("LoRa Failed!");
    display.println("LoRa Failed!");
    display.display();
  } else {
    Serial.println("LoRa Initialized!");
  }

  delay(2000);
  display.clearDisplay();
  display.println("Ready...");
  display.display();
}

void loop() {
  // Display current time and voltage on OLED
  display.clearDisplay();
  display.setCursor(0, 0);

  // Get the current time from RTC
  DateTime now = rtc.now();
  String currentTime = now.timestamp(DateTime::TIMESTAMP_TIME);
  String currentDate = now.timestamp(DateTime::TIMESTAMP_DATE);

  // Read voltage input
  int sensorValue = analogRead(VOLTAGE_PIN);
  float voltage = sensorValue * (3.3 / 4095.0) * 2; // Adjusted for 3.3V reference voltage and internal voltage divider

  // Display current time and voltage
  display.setTextSize(1);
  display.print("Voltage: ");
  display.print(voltage);
  display.println(" V");

  display.setTextSize(2); // Set text size to 2 for the time
  display.print("Jam: ");
  display.println(currentTime);

  display.setTextSize(1); // Set text size back to 1 for the date
  display.println(currentDate);

  // Ticker display for "Waiting for RFID..."
  static int tickerPos = 128; // Start position off-screen to the right
  String tickerText = "Waiting for RFID...";
  int textWidth = tickerText.length() * 6; // Approximate width (6 pixels per character)

  display.setCursor(tickerPos, 40); // Move ticker slightly below
  display.println(tickerText);
  display.display();

  // Update ticker position
  tickerPos -= 2; // Move left by 2 pixels
  if (tickerPos < -textWidth) {
    tickerPos = 128; // Reset position once text is off-screen
  }

  uint8_t uid[7];
  uint8_t uidLength;

  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 2000)) {
    String uidStr = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      if (uid[i] < 0x10) uidStr += "0";
      uidStr += String(uid[i], HEX);
    }
    uidStr.toLowerCase();

    // Cari nama berdasarkan UID
    String nama = cariNama(uidStr);

    // Timestamp RTC
    DateTime now = rtc.now();
    String timestamp = now.timestamp(DateTime::TIMESTAMP_FULL);

    // Data untuk disimpan
    String dataString = nama + "," + uidStr + "," + timestamp;

    // Simpan ke SD
    Serial.println("Opening log file...");
    File dataFile = SD.open("/log.csv", FILE_APPEND);
    if (dataFile) {
      Serial.println("Writing to SD card...");
      dataFile.println(dataString);
      dataFile.close();
    } else {
      Serial.println("Failed to open log file!");
    }

    // Tampilkan ke OLED
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextSize(2); // Set text size to 2 for the name
    display.println(nama);
    display.setTextSize(1); // Set text size back to 1 for the rest of the text
    display.println("UID: " + uidStr);
    display.println(timestamp);
    display.display();

    // Kirim via LoRa
    Serial.println("Sending data via LoRa...");
    LoRa.beginPacket();
    LoRa.print(dataString);
    LoRa.endPacket();

    Serial.println(dataString);

    delay(3000);
  }

  delay(100); // Update every 100 milliseconds for smoother scrolling
}
