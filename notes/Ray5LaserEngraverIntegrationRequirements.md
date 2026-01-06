# **Comprehensive Technical Analysis of LightBurn Software Integration with MKS DLC32-Based Gantry Laser Systems: The Longer Ray5 Paradigm**

## **1\. Introduction: The Convergence of Digital Fabrication and Firmware Logic**

The democratization of laser manufacturing technology has been propelled by the rapid maturation of diode-based optical systems and the concurrent evolution of accessible, yet professional-grade, control software. In this ecosystem, the interaction between the layout engine and the motion controller is not merely a matter of file transfer but a complex synchronization of trajectory planning, power modulation, and firmware handshaking. This report provides an exhaustive technical analysis of the compatibility and optimization protocols necessary to integrate **LightBurn**, the industry-standard control interface, with basic gantry-style diode engravers.

We utilize the **Longer Ray5** as the primary reference architecture for this analysis. The Ray5 serves as an ideal case study due to its reliance on the **MKS DLC32 V2.1** motherboard, a 32-bit controller that represents the modern standard for desktop fabrication. Unlike legacy 8-bit Arduino systems, the MKS DLC32 introduces complex features such as Wi-Fi connectivity, touch screen interfacing, and high-speed ESP32 processing, all of which introduce specific configuration variables within the LightBurn environment.1

This document is structured to guide systems integrators and advanced operators through the hierarchy of operation: from the fundamental licensing architecture and driver level communication protocols to the granular firmware parameters that govern motion physics (GRBL 1.1) and the peripheral logic required for air assist and rotary subsystems. By dissecting these layers, we establish a definitive protocol for transforming a consumer-grade gantry laser into a precision instrument capable of industrial reliability.

## **2\. Systems Architecture and Licensing Framework**

### **2.1 The LightBurn Core License Model**

The foundational step in establishing compatibility lies in identifying the controller topology. LightBurn distinguishes between machine types through a tiered licensing structure. For the Longer Ray5, and indeed for the vast majority of open-frame diode gantry lasers, the required tier is the **LightBurn Core License** (formerly known as the G-Code License).3

It is imperative to understand the distinction between this tier and the DSP or Galvo tiers to avoid architectural mismatches.

* **G-Code (Core):** This tier supports text-based command interpreters including GRBL, Smoothieware, Marlin, and FluidNC. The Longer Ray5 runs a modified version of GRBL on its ESP32 MCU, natively interpreting G0 (rapid), G1 (linear cut), and M-code auxiliary commands.1  
* **DSP:** Designed for proprietary industrial controllers (Ruida, Trocen) typical in CO2 enclosed systems, which use binary packet communication rather than ASCII text streams.  
* **Galvo:** Utilizes mirror-based deflection systems (EZCAD) rather than Cartesian gantries.3

For an operator deploying a Longer Ray5, the G-Code license enables the software to function as the primary path planner, streaming discrete movement vectors to the MKS DLC32 buffer. The software handles the heavy lifting of converting vector geometry (SVG, DXF, AI) into the machine-readable syntax, while the firmware manages step-pulse timing.

### **2.2 Controller Hardware: The MKS DLC32 Paradigm**

The technical capability of the Longer Ray5 is defined by the **MKS DLC32 V2.1** motherboard. Understanding this board is critical for advanced configuration within LightBurn.

* **Microcontroller Unit (MCU):** The board is driven by an **ESP32-WROOM-32U**, featuring a dual-core 32-bit CPU clocked at 240MHz. This is a significant departure from the 16MHz ATMega328p found in older gantry lasers. The higher clock speed allows for faster G-code parsing, smoother acceleration ramping, and jitter-free pulse generation even at high feed rates.1  
* **Memory Architecture:** With 8MB of Flash and 520KB of RAM, the controller enables extensive buffering. LightBurn can leverage this by utilizing "Buffered" transfer modes, preventing data starvation during complex raster engraving operations where thousands of power-state changes occur per second.1  
* **I/O Expansion:** The board exposes GPIO pins for peripherals such as limit switches, probes, and TTL (Transistor-Transistor Logic) PWM signals, which LightBurn addresses via specific device settings.4

| Hardware Component | Specification | LightBurn Implication |
| :---- | :---- | :---- |
| **MCU** | ESP32-WROOM-32U (32-bit) | Supports high baud rates (115,200+); faster processing of raster data. |
| **Flash Memory** | 8192 Kbytes | Allows large file buffering; prevents stuttering in complex vector paths. |
| **Stepper Drivers** | A4988 / TMC2208 | Silent operation; requires specific step/mm calibration in firmware. |
| **Connectivity** | USB / Wi-Fi (802.11 b/g/n) | Enables both Serial (USB) and potential IP-based control workflows. |
| **Laser Control** | TTL / PWM (1kHz \- 10kHz) | Requires S-Value Max synchronization for linear power scaling. |

Table 1: MKS DLC32 V2.1 Hardware Specifications relevant to LightBurn Configuration.1

## **3\. Communication Layer Configuration**

### **3.1 The Physical Layer: USB and Drivers**

The primary communication vector between LightBurn and the Ray5 is a virtual serial port over USB. The MKS DLC32 utilizes the **CH340** USB-to-UART bridge chip to translate USB differential signals into the serial data stream the ESP32 can digest.4

For the operating system to present the laser as a COM port (Windows) or TTY device (macOS/Linux), the correct CH340 driver is mandatory.

* **Driver Integrity:** The LightBurn installer provides an option to install legacy drivers, but for modern macOS (Sequoia 15+) and Windows 11, fetching the latest signed drivers from the WCH (chip manufacturer) repository is often necessary to resolve "Port Busy" or connection timeout errors.6  
* **macOS Specifics:** Newer macOS versions impose strict kernel extension policies. The driver appears as /dev/tty.wchusbserial.... Failure to approve the extension in Security & Privacy settings will render the device invisible to LightBurn despite physical connection.7

### **3.2 Protocol Synchronization: Baud Rate**

The synchronization speed, or baud rate, defines the bit rate of the serial connection. The MKS DLC32 firmware is hard-coded to communicate at **115,200 baud**.5

A mismatch here is the most common failure mode during initial setup. If LightBurn is set to the default 9600 baud, it will fail to handshake with the controller, resulting in a "Waiting for Connection" state or the display of garbled characters in the console. The user must explicitly force this rate in the **Device Settings** or during the device creation wizard. Although the ESP32 chip supports speeds up to 921,600 baud for firmware flashing, the stable operation of the GRBL stream is standardized at 115,200 for this implementation.5

### **3.3 Networked Communication Topology**

The ESP32 architecture introduces the possibility of Wi-Fi control, a significant advancement over tethered USB connections. The MKS DLC32 supports both Station (STA) and Access Point (AP) modes.

* **Web Interface:** The board serves a web page allowing for file upload and simple control commands. LightBurn does not natively push G-code via the HTTP web interface of the MKS board in the same way it does for Ruida Bridge devices. However, users can save G-code from LightBurn and upload it via the browser for offline execution.9  
* **Telnet/WebSocket Bridge:** Advanced users can configure LightBurn to connect via Ethernet/TCP if the firmware exposes a Telnet server (Port 8080 or 23). By selecting "Ethernet/TCP" as the connection type in LightBurn and entering the IP address assigned to the Ray5, one can bypass the USB cable entirely. This requires stable network latency to prevent buffer underruns.10 The MKS DLC32 V2.1 firmware typically supports a WebSocket interface that mimics the serial stream, allowing for real-time status reporting and command injection.11

## **4\. Device Profile Configuration in LightBurn**

### **4.1 Manual Device Creation Protocol**

While LightBurn includes a "Find My Laser" heuristic scanner, manual configuration is rigorously recommended for the Longer Ray5 to ensure all parameters match the physical machine constraints. The "Find My Laser" tool queries known USB vendor IDs, but generic CH340 chips are used in thousands of devices, leading to potential misidentification.3

**Manual Setup Parameters:**

1. **Generator:** Select **GRBL**. Do not select GRBL-M3 or GRBL-LPC unless specifically running legacy firmware. The Ray5 runs a modern GRBL 1.1 fork that supports variable power (M4) commands.12  
2. **Connection:** Serial/USB (unless using the Telnet method described in 3.3).  
3. **Origin Definition:** The Cartesian origin (0,0) for the Ray5 is the **Front Left**. This is the industry standard for diode gantries. Selecting Rear Left or Center will result in mirrored or inverted output, where text appears backwards or the machine crashes into rails when jogging.13  
4. **Dimensional Limits:** The workspace dimensions are model-specific and act as a software limit to prevent frame collisions.  
   * **Ray5 5W / 10W:** 400mm (X) x 400mm (Y).  
   * **Ray5 20W:** 375mm (X) x 375mm (Y). The reduction in the 20W model is necessitated by the larger physical footprint of the laser head and cooling assembly, which reduces the effective travel along the gantry.14

### **4.2 S-Value Max and Power Scaling**

One of the most critical settings in LightBurn for diode lasers is the **S-Value Max**. This integer defines the PWM resolution used to modulate laser power.

* **The Physics:** The laser module's driver accepts a PWM signal where the duty cycle determines the optical output. If the signal is high 50% of the time, the laser outputs 50% power.  
* **The Configuration:** GRBL 1.1 standards dictate a scale of 0 to 1000\. Therefore, LightBurn must send S1000 to request 100% power.  
* **The Mismatch:** If LightBurn is left at the legacy default of 255 (common for 8-bit Arduino builds), sending 100% power (S255) will be interpreted by the Ray5 controller (expecting 1000\) as only 25.5% power. This results in an inability to cut materials or extremely faint engravings.  
* **Resolution:** Users must verify in **Device Settings** that S-Value Max is set to **1000**. This must match the $30 parameter in the machine's firmware.5

### **4.3 Transfer Protocols and Buffer Management**

The MKS DLC32's large memory buffer allows for **Buffered** transfer mode, which is the default in LightBurn for GRBL. In this mode, LightBurn sends blocks of G-code to fill the controller's planning buffer, allowing the motion planner to optimize acceleration and deceleration curves ahead of time. This results in smoother motion compared to "Synchronous" mode, which is a call-and-response protocol.16

However, high-traffic Wi-Fi environments using the Telnet connection may experience packet loss. In such instances, switching to **Synchronous** transfer mode ensures data integrity at the cost of potential motion stuttering, as the software waits for an ok acknowledgement for every line of code sent.17

## **5\. Firmware Parameter Optimization (GRBL $$)**

The interaction between LightBurn and the hardware is governed by firmware variables stored in the EEPROM of the ESP32. These can be viewed and modified via the LightBurn Console by typing $$.

### **5.1 Laser Mode ($32)**

The $32 parameter is the binary switch for Laser Mode.

* **Value:** Must be set to **1** ($32=1).18  
* **Function:** This disables spindle-specific behaviors intended for CNC mills, such as pausing movement to allow a spindle to spin up. Crucially, it enables the **M4 Dynamic Power** command.  
* **Implication:** In M4 mode, the controller automatically scales laser power based on the current speed of the gantry. As the laser decelerates to turn a sharp corner, the power is reduced proportionally to prevent over-burning (charring) at the corner. Without this setting ($32=0), the laser operates in constant power (M3), leading to burnt corners and inconsistent shading in raster images.19

### **5.2 Kinematic Tuning ($110-$121)**

The Ray5 is advertised with speeds up to 10,000 mm/min, but reliable operation requires tuning the maximum rate and acceleration parameters.

* **Max Rate ($110 X, $111 Y):** While the machine can move at 10,000 mm/min, practical cutting speeds are often lower. Setting this hard limit in firmware prevents the software from commanding speeds that would cause stepper motor stalls.20  
* **Acceleration ($120 X, $121 Y):** Acceleration defines how quickly the machine reaches the target speed. Higher acceleration reduces production time but introduces mechanical "ringing" or "ghosting" (wavy lines) due to frame vibration. For the Ray5, a conservative acceleration of **500-1000 mm/sec²** allows for crisp lines while maintaining torque.18 If layer shifting occurs (where the image steps to the side), lowering these acceleration values is the first troubleshooting step.

### **5.3 Step Calibration ($100, $101)**

The $100 (X) and $101 (Y) parameters define the number of motor steps required to move the gantry 1mm. The Ray5 uses GT2 belts and 1.8-degree steppers.

* **Standard Value:** Typically **80 steps/mm**.  
* **Calibration:** If a 100mm square cuts as 98mm, these values require adjustment. LightBurn includes a **Calibrate Axis** tool (Edit \> Machine Settings) that automates the math: $New Steps \= Current Steps \\times (Requested Distance / Actual Distance)$.18

## **6\. Advanced Peripheral Integration**

### **6.1 Automated Air Assist Integration**

Air assist is vital for cutting performance, clearing smoke from the beam path and supplying oxygen for combustion or cooling the melt pool. While the stock Ray5 uses a manual valve, the MKS DLC32 supports automated control via LightBurn layers.

* **Command Logic:** LightBurn uses standard G-code commands **M8** (Flood Coolant On) to activate air assist and **M9** (Coolant Off) to deactivate it.  
* **Hardware Interface:** The MKS DLC32 V2.1 does not always populate a dedicated "Air" MOS interface. Instead, the signal is often routed through the **I2C SCL** pin (IO22) or a spare TTL pin. This pin outputs a 3.3V or 5V logic signal, which is insufficient to drive a solenoid valve or pump directly.21  
* **Implementation:** An external relay module or MOSFET board is required. The SCL pin acts as the trigger for the relay, which then switches the 12V/24V rail to the air pump.  
* **LightBurn Setup:** In **Device Settings**, the "Air Assist" toggle must be enabled. This allows the user to toggle "Air" for specific layers in the Cuts/Layers window. When the job runs, LightBurn automatically inserts M8 commands at the start of air-enabled layers.21

### **6.2 Rotary Attachment Protocols**

Integrating a rotary axis (for engraving tumblers or cylindrical objects) requires remapping the Y-axis logic.

* **Mechanism:** The rotary motor connects to the Y-axis stepper port on the motherboard. The machine now translates Y-axis G-code coordinates into rotation.  
* **Roller Rotary:** The Longer official rotary is a roller type. Setup requires defining the **Roller Diameter** (fixed hardware dimension) and the **Steps Per Rotation**.  
  * **Computation:** $Steps per mm \= Steps per Rotation / (Roller Diameter \\times \\pi)$.  
  * The snippet data suggests a specific Y-step setting for the Ray5 rotary is **56.00** or **56.52** steps/mm, diverging from the standard 80 steps/mm used for the linear belt drive.23  
* **Chuck Rotary:** If using a third-party chuck rotary, the calculation changes to reflect the gear reduction ratio and the motor steps. LightBurn's **Rotary Setup** tool manages these variables, but the user must calculate the specific mm per rotation based on the chuck's gearing.24  
* **Workflow:** The "Enable Rotary" switch in LightBurn modifies the output G-code, often effectively removing Y-axis homing commands that would otherwise cause the rotary to spin indefinitely looking for a limit switch that doesn't exist on the cylinder.25

## **7\. Optical and Vision System Calibration**

### **7.1 Scanning Offset Adjustment**

Raster engraving at high speeds (e.g., 6000 mm/min) introduces a specific artifact known as bidirectional misalignment. Because the laser head has mass, mechanical backlash and belt stretch cause the physical head position to lag slightly behind the commanded position during direction changes. Furthermore, the laser power supply has a minute latency in firing the beam.

* **Symptom:** Edges of the engraving appear jagged or "ghosted," with left-to-right scans not aligning with right-to-left scans.  
* **Correction:** LightBurn’s **Scanning Offset Adjustment** (Device Settings) allows the user to define a compensation value (in mm) for specific speeds.  
* **Procedure:** A test pattern is engraved at various speeds. The operator measures the offset distance between the scan lines and inputs this into the table. LightBurn then shifts the timing of the laser pulses to align the image perfectly. For the Ray5, typical offset values range from **0.05mm to 0.2mm** depending on belt tension.26

### **7.2 Camera Overlay Alignment**

Installing a camera (such as the official LightBurn camera or a standard USB webcam) allows users to see the machine bed within the software workspace.

* **Lens Calibration:** This corrects the optical distortion (fisheye) of the lens. It involves capturing a dot-pattern card in multiple orientations. The software calculates a corrective matrix to flatten the image.3  
* **Camera Alignment:** This registers the camera image to the machine's physical coordinate system. The Ray5 engraves a target pattern (four crosshairs), which the user then clicks on within the camera feed. This calculates the homography matrix, linking pixel coordinates to G-code coordinates (X,Y).28  
* **Accuracy Limits:** Accuracy is heavily dependent on the Z-height of the material. Since the camera is 2D, the alignment is only valid for the specific material thickness used during calibration unless the camera is re-aligned or the Z-axis of the machine is adjusted to maintain a constant focal plane relative to the camera.29

## **8\. Diagnostic and Error Recovery**

### **8.1 Interpreting GRBL Error Codes**

The LightBurn Console is the primary diagnostic interface. Common errors on the Ray5 include:

* **Error: 9 (G-code Locked):** This occurs if the machine has not been homed (if $22=1 is enabled) or if a limit switch is triggered. The system enters a lock state to prevent damage. Sending $X (Kill Alarm Lock) or performing a homing cycle $H resolves this.30  
* **Error: 24 (Invalid Target):** Often seen when connecting via USB. It implies a syntax error or a corrupted data packet, frequently caused by electromagnetic interference (EMI) from the stepper motors bleeding into an unshielded USB cable. Replacing the stock USB cable with a high-quality ferrite-shielded cable is the standard hardware fix.30  
* **ALARM: 2 (Soft Limit):** The G-code command exceeds the defined max travel ($130, $131). This happens if the workspace in LightBurn (e.g., 400x400) is larger than the firmware settings, or if the user attempts to run a job without homing the machine first, causing the controller to lose track of its absolute position.18

### **8.2 Firmware Compatibility Issues**

It is critical to note that firmware updates can alter pin definitions. Some users upgrading from Ray5 firmware versions 1.2.4 to 2.2.12 have reported hardware conflicts, specifically regarding the **tilt sensor**. The motherboard pinout for the tilt sensor changed between revisions, requiring users to either disconnect the sensor or replace it to avoid persistent alarms that prevent the machine from initializing.31 LightBurn cannot override a hardware safety alarm; the physical sensor state must be resolved.

## **9\. Workflow Optimization Strategy**

To achieve professional results with the Longer Ray5, the following optimization workflow is recommended:

1. **Macro Configuration:** Create custom macros in the LightBurn Console for frequent tasks. For example, a "Focus" macro (fire laser at 1% power) or a "Center" macro (G0 X200 Y200) streamlines operation.  
2. **Material Library:** Use the LightBurn Material Library to catalog optimal Speed/Power settings for specific materials. This decouples the "art" of laser settings from the "science" of machine configuration.  
3. **Origin Consistency:** Always start the machine with the head in the Front-Left corner (if no limit switches are installed) to ensure the power-on location matches the software origin (0,0). Failure to do this invalidates "Absolute Coords" positioning.32

| $ Setting | Value | Description |
| :---- | :---- | :---- |
| **$30** | 1000 | Max Spindle Speed (Must match S-Value Max in LightBurn) |
| **$32** | 1 | Laser Mode Enable (Required for M4 dynamic power) |
| **$110** | 10000 | X Max Rate (mm/min) |
| **$111** | 10000 | Y Max Rate (mm/min) |
| **$120** | 500-1000 | X Acceleration (mm/sec^2) \- Lower for higher quality |
| **$121** | 500-1000 | Y Acceleration (mm/sec^2) \- Lower for higher quality |

Table 2: Recommended Firmware Parameters for Longer Ray5 12

## **10\. Conclusion**

The integration of the Longer Ray5 with LightBurn transforms a consumer-grade appliance into a capable digital fabrication station. The MKS DLC32 controller provides the necessary computational throughput for complex vector analysis, provided the communication layer is correctly synchronized via the CH340 driver and proper baud rate settings. By moving beyond the basic defaults—specifically by tuning acceleration physics, enabling dynamic laser power modes, and integrating air assist logic via GPIO manipulation—users can unlock the full potential of the hardware. This analysis demonstrates that compatibility is not a binary state but a spectrum of configuration, where precision is achieved through the granular alignment of software logic (LightBurn) with firmware reality (GRBL).

#### **Works cited**

1. MKS DLC32 Offline Controller for Laser Engraver from Maker's Cave on Tindie, accessed January 5, 2026, [https://www.tindie.com/products/makers-cave/mks-dlc32-offline-controller-for-laser-engraver/](https://www.tindie.com/products/makers-cave/mks-dlc32-offline-controller-for-laser-engraver/)  
2. Makerbase MKS DLC32 32-bits Laser Engraver Control Board \- Geekbuying, accessed January 5, 2026, [https://www.geekbuying.com/item/Makerbase-MKS-DLC32-32-bits-Laser-Engraver-Control-Board-519784.html](https://www.geekbuying.com/item/Makerbase-MKS-DLC32-32-bits-Laser-Engraver-Control-Board-519784.html)  
3. LightBurn2.0.pdf  
4. MKS DLC32 MAX Manual, accessed January 5, 2026, [https://blog.diode-laser-wiki.com/wp-content/uploads/2025/02/MKS-DLC32-MAX-Manual.pdf](https://blog.diode-laser-wiki.com/wp-content/uploads/2025/02/MKS-DLC32-MAX-Manual.pdf)  
5. LONGER RAY5 Mini Series Laser Engraver User Guide \- device.report, accessed January 5, 2026, [https://device.report/manual/18059407](https://device.report/manual/18059407)  
6. Unable to connect to LightBurn or LaserGBRL \- LONGER, accessed January 5, 2026, [https://www.longer3d.com/de/blogs/troubleshooting/unable-to-connect-to-lightburn-or-lasergbrl](https://www.longer3d.com/de/blogs/troubleshooting/unable-to-connect-to-lightburn-or-lasergbrl)  
7. LightBurn not detecting Longer Nano Pro 12W on MacBook M4 (macOS Sequoia 15.3.1) – CH340 driver won't install or activate, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/lightburn-not-detecting-longer-nano-pro-12w-on-macbook-m4-macos-sequoia-15-3-1-ch340-driver-won-t-install-or-activate/184515](https://forum.lightburnsoftware.com/t/lightburn-not-detecting-longer-nano-pro-12w-on-macbook-m4-macos-sequoia-15-3-1-ch340-driver-won-t-install-or-activate/184515)  
8. USB Not Connected \- first two attempts failed : r/LongerLaser \- Reddit, accessed January 5, 2026, [https://www.reddit.com/r/LongerLaser/comments/1pkl03u/usb\_not\_connected\_first\_two\_attempts\_failed/](https://www.reddit.com/r/LongerLaser/comments/1pkl03u/usb_not_connected_first_two_attempts_failed/)  
9. Starting with MKS DLC32 \- GRBL \- V1E.com Forum, accessed January 5, 2026, [https://forum.v1e.com/t/starting-with-mks-dlc32/41732](https://forum.v1e.com/t/starting-with-mks-dlc32/41732)  
10. Mks dlc 32 v 2.1 \- Page 2 \- Community Laser Talk \- LightBurn Software Forum, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/mks-dlc-32-v-2-1/137144?page=2](https://forum.lightburnsoftware.com/t/mks-dlc-32-v-2-1/137144?page=2)  
11. Web Sockets \- esp3d.io, accessed January 5, 2026, [https://esp3d.io/ESP3D-WebUI/Version\_3.X/documentation/api/websockets/](https://esp3d.io/ESP3D-WebUI/Version_3.X/documentation/api/websockets/)  
12. Longer Ray 5 20W GRBL controller power \- LightBurn Software Forum, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/longer-ray-5-20w-grbl-controller-power/134755](https://forum.lightburnsoftware.com/t/longer-ray-5-20w-grbl-controller-power/134755)  
13. LONGER Products RAY5, accessed January 5, 2026, [https://images.thdstatic.com/catalog/pdfImages/14/14d78c90-d6a0-4cfb-8185-1a3fac336487.pdf](https://images.thdstatic.com/catalog/pdfImages/14/14d78c90-d6a0-4cfb-8185-1a3fac336487.pdf)  
14. LONGER Ray5 20W/10W/5W Laser Engraver with Engraving Area 400x400mm 3.5'' Touchscreen 32-bit Motherboard Support App WIFI USB \- AliExpress, accessed January 5, 2026, [https://www.aliexpress.com/item/1005002883649894.html](https://www.aliexpress.com/item/1005002883649894.html)  
15. Powerful Longer RAY5 20W Laser Engraver & Cutter Multi-Color Engraving \- Htpowlasers, accessed January 5, 2026, [https://www.htpowlasers.com/products/longer-ray5-20w-powerful-laser-engraver](https://www.htpowlasers.com/products/longer-ray5-20w-powerful-laser-engraver)  
16. GRBL Execution Pipeline | Wiki.js \- FluidNC, accessed January 5, 2026, [http://wiki.fluidnc.com/en/development/grbl-pipeline](http://wiki.fluidnc.com/en/development/grbl-pipeline)  
17. character counting gcode sender for GRBL in arduino uno, accessed January 5, 2026, [https://forum.arduino.cc/t/character-counting-gcode-sender-for-grbl-in-arduino-uno/531139](https://forum.arduino.cc/t/character-counting-gcode-sender-for-grbl-in-arduino-uno/531139)  
18. GRBL firmware settings/parameters \- hex files, download, update \- Endurance Lasers, accessed January 5, 2026, [https://endurancelasers.com/an-important-things-you-need-to-know-about-grbl-firmware/](https://endurancelasers.com/an-important-things-you-need-to-know-about-grbl-firmware/)  
19. How to Use LaserGRBL with the Ray5 Mini: Laser Engraving Setup and Settings \- LONGER, accessed January 5, 2026, [https://www.longer3d.com/blogs/laser-engraver-academy-1/how-to-use-lasergrbl-to-control-the-ray5-mini-for-laser-engraving](https://www.longer3d.com/blogs/laser-engraver-academy-1/how-to-use-lasergrbl-to-control-the-ray5-mini-for-laser-engraving)  
20. MakerBase MKS DLC32 CNC-Controller Board V.2 \- ElectroPeak, accessed January 5, 2026, [https://electropeak.com/makerbase-mks-dlc32-cnc-controller-board-v-2](https://electropeak.com/makerbase-mks-dlc32-cnc-controller-board-v-2)  
21. Relay Control \- Diode Laser Wiki, accessed January 5, 2026, [https://diode-laser-wiki.com/documentation/extras/relay-control/](https://diode-laser-wiki.com/documentation/extras/relay-control/)  
22. Air assist pin · Issue \#53 · makerbase-mks/MKS-DLC32 \- GitHub, accessed January 5, 2026, [https://github.com/makerbase-mks/MKS-DLC32/issues/53](https://github.com/makerbase-mks/MKS-DLC32/issues/53)  
23. LONGER Rotating Roller Manual | PDF | Screw | Nut (Hardware) \- Scribd, accessed January 5, 2026, [https://www.scribd.com/document/915178929/LONGER-Rotating-Roller-Manual](https://www.scribd.com/document/915178929/LONGER-Rotating-Roller-Manual)  
24. Step Per Rotation \- Roller Rotary \- Aeon Laser USA, accessed January 5, 2026, [https://shop.aeonlaser.us/a/docs/troubleshooting/step-per-rotation-roller-rotary](https://shop.aeonlaser.us/a/docs/troubleshooting/step-per-rotation-roller-rotary)  
25. Solved Longer Ray5 Rotary \- LightBurn Software Forum, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/solved-longer-ray5-rotary/98230](https://forum.lightburnsoftware.com/t/solved-longer-ray5-rotary/98230)  
26. API Endpoints \- Open WebUI, accessed January 5, 2026, [https://docs.openwebui.com/getting-started/api-endpoints/](https://docs.openwebui.com/getting-started/api-endpoints/)  
27. Camera Calibration \- LightBurn Documentation, accessed January 5, 2026, [https://docs.lightburnsoftware.com/Camera/Calibration.html](https://docs.lightburnsoftware.com/Camera/Calibration.html)  
28. Lens calibration algorithm is jacked \- Cameras \- LightBurn Software Forum, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/lens-calibration-algorithm-is-jacked/138053](https://forum.lightburnsoftware.com/t/lens-calibration-algorithm-is-jacked/138053)  
29. LightBurn Camera calibration, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/lightburn-camera-calibration/66190](https://forum.lightburnsoftware.com/t/lightburn-camera-calibration/66190)  
30. API \- esp3d.io, accessed January 5, 2026, [https://esp3d.io/ESP3D/Version\_2.1.X/documentation/api/](https://esp3d.io/ESP3D/Version_2.1.X/documentation/api/)  
31. LONGER How To: Solving Ray5 Firmware Compatibility Issues from 1.2.4 to 2.2.12, accessed January 5, 2026, [https://www.longer3d.com/blogs/operation-tutorial/longer-how-to-solving-ray5-firmware-compatibility-issues-from-1-2-4-to-2-2-12](https://www.longer3d.com/blogs/operation-tutorial/longer-how-to-solving-ray5-firmware-compatibility-issues-from-1-2-4-to-2-2-12)  
32. FAQs \- LONGER, accessed January 5, 2026, [https://www.longer3d.com/pages/faqs](https://www.longer3d.com/pages/faqs)