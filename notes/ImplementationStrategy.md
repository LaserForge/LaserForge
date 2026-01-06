# **Architectural Specification and Implementation Strategy for a Web-Based Laser CAM Platform**

## **1\. Introduction and Scope**

The landscape of Computer-Aided Manufacturing (CAM) software for laser fabrication is currently dominated by desktop-native solutions, most notably LightBurn. LightBurn has established itself as the industry standard by unifying the design, layout, and control phases of laser operation into a singular, cohesive interface capable of driving a diverse array of hardware architectures—specifically GCode, Digital Signal Processing (DSP), and Galvometric (Galvo) systems.1 As the software industry migrates toward platform-agnostic, browser-based solutions, the demand for a web-based alternative to LightBurn has intensified. This report provides an exhaustive technical analysis and architectural blueprint for developing such a platform.

The objective of this research is to define the technical requirements, algorithmic strategies, and interface designs necessary to replicate the full feature set of LightBurn within a web browser environment. This includes a deep analysis of hardware communication protocols via Web Serial and WebUSB APIs, the implementation of complex vector manipulation engines using WebAssembly (WASM), and the replication of proprietary control methodologies for industrial controllers like Ruida and EZCAD. The report is structured to guide engineering teams through the reconstruction of LightBurn’s functionality—from basic vector creation to advanced camera-assisted positioning and rotary attachment compensation—while navigating the unique constraints of the browser sandbox. By leveraging modern web capabilities, it is possible to create a solution that offers the performance of native applications with the accessibility of the cloud.

## **2\. Core System Architecture**

To achieve feature parity with a high-performance desktop application like LightBurn, a web-based alternative cannot rely on standard DOM (Document Object Model) manipulation or single-threaded JavaScript execution. The architecture must be a hybrid system that leverages the browser for User Interface (UI) rendering and hardware abstraction, while offloading geometry processing and device communication to lower-level languages compiled to WebAssembly.

### **2.1 The High-Performance Browser Environment**

The browser environment presents specific challenges regarding memory management and execution speed. LightBurn handles files containing hundreds of thousands of vector nodes.1 Managing this in a standard HTML Canvas or SVG DOM would result in unacceptable latency.

The proposed solution utilizes a **WebAssembly (WASM)** core derived from C++ or Rust. This core handles the heavy computational lift of boolean operations, offset generation, and toolpath optimization. Libraries such as Clipper2, which is essential for polygon clipping and offsetting 2, must be compiled to WASM to ensure that operations like "Weld" or "Offset Shapes" execute near-instantaneously, regardless of the client machine's specifications.

Furthermore, the architecture mandates the use of **Web Workers** to separate the User Interface thread from the processing threads. JavaScript is single-threaded; without workers, generating GCode for a complex image engraving would freeze the UI, rendering the "Stop" or "Pause" buttons unresponsive.4 A dedicated "Device Worker" will handle the real-time streaming of commands to the laser, ensuring that the data buffer remains full even if the user is manipulating heavy graphics in the main window.

### **2.2 Graphics Rendering Pipeline**

LightBurn’s workspace acts as both a design canvas and a machine simulation environment. It renders vectors, bitmaps, and toolpaths simultaneously. The web alternative must employ a **WebGL** or **WebGPU** rendering engine, such as Three.js or Pixi.js. These libraries utilize the GPU to render vast numbers of 2D primitives, allowing for smooth panning and zooming (up to 60fps) even with complex architectural diagrams loaded.5

The rendering engine must support coordinate transformation matrices to map the "World Space" (the physical dimensions of the laser bed, e.g., 900x600mm) to the "Screen Space" (the browser viewport). This involves affine transformations—scaling, translating, and rotating—to replicate the behavior of LightBurn’s navigation tools, including "Zoom to Page," "Zoom to Selection," and "Pan Drag".1

### **2.3 Cross-Protocol Hardware Abstraction Layer**

A defining feature of LightBurn is its ability to talk to radically different machines using a single interface. The web architecture must abstract these differences into a unified driver layer.

- **GCode Devices (GRBL, Marlin, Smoothieware):** These devices communicate via virtual serial ports. The **Web Serial API** provides the necessary access, allowing the browser to request permission to connect to a specific COM port and establish a bidirectional stream.6 This API supports the setting of baud rates (typically 115,200) and buffer sizes required for stable GCode streaming.7
- **Galvo Devices (EZCAD2/3):** These systems use a proprietary USB protocol involving bulk data transfers rather than serial streams. The **WebUSB API** enables the browser to claim the USB interface, send vendor-specific control transfers, and manage bulk endpoints directly from user space.8 This bypasses the need for the proprietary Windows drivers used by EZCAD, potentially offering a smoother setup experience on non-Windows platforms.10
- **DSP Controllers (Ruida/Trocen):** These industrial controllers predominantly use UDP communication over Ethernet.11 Browsers effectively block raw UDP socket access for security reasons. Therefore, a pure web application cannot communicate directly with a networked Ruida controller. The architecture requires a **Local Bridge Service**—a lightweight executable (written in Go or Rust) installed on the user's machine that creates a WebSocket server. The web application sends commands to the local WebSocket, and the Bridge relays them as UDP packets to the laser.12

## ---

**3\. User Interface and Workspace Functionality**

The User Interface of LightBurn is characterized by its modularity and density of information. The "Main Window" is not static; it is composed of dockable panels that users can rearrange.1 A web implementation must utilize a flexible layout framework (like Golden Layout or React-Grid-Layout) to allow users to toggle windows such as "Cuts/Layers," "Move," "Console," and "Shape Properties" on or off, or dock them to different sides of the viewport.1

### **3.1 The Edit Window and Selection Logic**

The central component is the Edit Window, which represents the laser's physical work area.

- **Grid Systems:** The workspace must render a grid corresponding to the machine's dimensions (e.g., 100mm squares). The contrast of this grid must be adjustable, as found in LightBurn's settings.1
- **Selection Mechanics:** Replicating LightBurn’s selection logic is critical. The software distinguishes between:
  - **Enclosing Selection (Red Box):** Dragging from left to right selects only objects fully contained within the box.
  - **Crossing Selection (Green Box):** Dragging from right to left selects any object the box touches or contains.1
  - **Implementation:** This requires a spatial index (such as a Quadtree or R-Tree) in the backend to efficiently query geometric bounds against the selection rectangle coordinates.

### **3.2 The Cuts / Layers Window**

The Cuts/Layers window is the operational heart of the software, determining _how_ the design is interpreted by the laser.

- **Layer Color Mapping:** LightBurn uses a palette of colors (00 to 29\) to represent distinct sets of cut parameters.1 The web application must maintain a state object mapping each hex color code to a parameter set.
- **Parameter Hierarchy:**
  - **Speed:** Defined in mm/sec or mm/min.
  - **Power:** Max and Min power percentages.
  - **Mode:** Line, Fill, Offset Fill, or Image.
  - **Pass Count:** Number of repetitions.
  - **Interval/LPI:** Distance between scan lines for Fill/Image modes.
- **Ordering:** The execution order is determined by the list order in this window. The UI must support drag-and-drop reordering of layers, which directly alters the sequence of the generated GCode or DSP instruction set.1

### **3.3 Shape Properties and Numeric Edits**

Precise control over geometry is a requirement for engineering-grade work.

- **Numeric Edits Toolbar:** This toolbar allows users to input exact X, Y, Width, and Height values. Crucially, LightBurn supports mathematical equations in these fields (e.g., entering "50/2" results in "25") and unit conversion (entering "1in" converts to "25.4mm").1 The web input fields must intercept keystrokes to parse and evaluate these expressions before applying them to the object state.
- **Shape Properties:** For parametric shapes like Rectangles or Polygons, properties like "Corner Radius" or "Number of Sides" remain editable after creation.1 The data model must retain the parametric definition of the shape (e.g., "Rectangle: w=100, h=50, r=5") rather than immediately baking it into a generic path, allowing for non-destructive editing until the user explicitly "Converts to Path."

### **3.4 Tools and Modifiers**

The Creation Tools must cover the standard vector set:

- **Pen/Line Tool:** Supports Bezier curves. The implementation needs a custom interaction model where clicking creates sharp nodes and dragging pulls out Bezier handles.1
- **Text Tool:** This is complex in a browser. Standard web fonts (TrueType/OpenType) can be rendered via the Canvas API. However, LightBurn also supports **SHX fonts** (single-line fonts) for fast CNC marking. The web app needs a custom font parser (likely WASM-based) to read SHX files and render them as vector paths rather than filled glyphs.1
- **QR Code Generator:** A built-in generator that outputs vector-based QR codes. The user inputs text/WiFi/Contact data, and the system generates the corresponding block geometry. Features include adjustable error correction levels and "weld" options to merge the code with other graphics.1

## ---

**4\. Vector Manipulation and Design Engine**

LightBurn is not just a driver; it is a capable vector editor. A web alternative must provide advanced boolean and modification tools that operate with high precision.

### **4.1 Boolean Operations (Weld, Union, Subtract, Intersect)**

These operations combine multiple shapes into one.

- **Weld:** Merges overlapping shapes into a single outline.
- **Boolean Union:** Similar to weld but retains inner geometry in specific ways.
- **Subtract:** Removes the area of one shape from another.
- **Intersect:** Retains only the overlapping area.1
- **Technical Implementation:** These operations are mathematically complex, especially with Bezier curves. The standard approach is to flatten curves into polylines, perform the boolean logic using a library like Clipper2 (ported to WASM for performance), and then optionally reconstruct the curves.2 This ensures robust handling of edge cases like self-intersecting polygons or coincident vertices.

### **4.2 Offset Shapes**

Offsetting involves creating a contour parallel to the original shape at a specific distance.1

- **Applications:** This is used for creating kerf adjustments (compensating for the laser beam width) or creating outline effects.
- **Algorithm:** The ClipperOffset library is the industry standard for this.2 The web application must expose parameters for "Outward," "Inward," or "Both," as well as "Corner Style" (Round, Bevel, Miter). The offset operation must handle the creation of islands (holes) when offsetting complex compound paths.

### **4.3 Node Editing**

The Node Editor gives users granular control over vector paths.

- **Functionality:** Users can move individual vertices, change line segments to curves (and vice versa), and adjust Bezier handles to smooth transitions.1
- **Logic:** The system must detect hover events over path segments to allow inserting new nodes (I key). It must track the continuity of the path (smooth vs. corner nodes) to determine if moving one handle should mirror the movement of the opposite handle (tangent continuity).1
- **Auto-Joining:** LightBurn allows joining open shapes if their endpoints are within a tolerance. This requires a spatial query to find all "dangling" endpoints and a distance check to merge them into closed loops, which is required for Fill operations.13

### **4.4 Optimization Tools**

- **Optimize Cut Path:** This tool reorders operations to minimize rapid travel time.1 It essentially solves the "Traveling Salesman Problem" (TSP). A heuristic algorithm (like Nearest Neighbor or Ant Colony Optimization) running in a Web Worker is necessary to calculate the most efficient path between thousands of vector start points.
- **Remove Overlapping Lines:** Duplicate lines cause the laser to cut twice, ruining the edge. The system must iterate through all line segments, checking for collinearity and overlap, and deleting redundant segments.1

## ---

**5\. Image Processing Pipeline**

Lasers treat images differently than screens. They require dithered bitmaps to represent gradients. The web application requires a robust client-side image processing engine.

### **5.1 Rasterization and Dithering**

When an image is imported, it must be processed according to the "Image Mode" selected for its layer.1

- **Threshold:** Simple binary black/white based on a cutoff value.
- **Dithering Algorithms:** LightBurn supports Jarvis, Stucki, Floyd-Steinberg, Atkinson, and Ordered Dithering. These error-diffusion algorithms distribute the quantization error to neighboring pixels, creating the illusion of grayscale using only black dots.14
- **Implementation:** Pixel manipulation is CPU-intensive. To maintain performance, the image data (ImageData from a Canvas) should be passed to a Web Worker or a WASM module. The dithered result is then rendered back to the canvas for preview.
- **Negative Image:** For materials like slate or dark acrylic, the image must be inverted (light becomes dark). This is a simple per-pixel inversion operation.1

### **5.2 Image Adjustment**

The "Adjust Image" tool allows non-destructive editing.1

- **Parameters:** Gamma, Contrast, Brightness, and Radius (sharpening).
- **Real-Time Preview:** To ensure the user sees changes immediately, these adjustments should be applied using WebGL fragment shaders. This allows the GPU to process the image filter instantly. The final "baked" image is only calculated when the job is sent to the laser.

### **5.3 Vectorization (Trace Image)**

This feature converts raster bitmaps into vector paths, useful for logos or sketches.1

- **Algorithm:** The standard for this is **Potrace**. A JavaScript port (imagetracerjs) or WASM compilation of the C library is required.16
- **Controls:** The UI must provide a "Threshold" slider to determine what brightness level defines an edge, and "Smoothness/Optimize" sliders to control the number of nodes in the resulting vector path. The system must render a live preview of the resulting vector (often in a contrasting color like purple) overlaid on the original image.1

## ---

**6\. Laser Control: GCode Systems**

GCode controllers (GRBL, Marlin, Smoothieware) are the most common in the diode and hobbyist CO2 market.

### **6.1 Serial Communication Implementation**

The **Web Serial API** enables direct connection.6

- **Connection Handshake:** Upon opening the port, the software sends a wake-up signal (\\r\\n\\r\\n) and listens for the firmware signature (e.g., Grbl 1.1f). It then queries the settings ($$) to determine machine bounds, acceleration, and laser mode status ($32).18
- **Streaming Protocol:** GCode cannot be dumped instantly; it will overflow the controller's receive buffer (typically 128 bytes). The application must implement a "character counting" or "request-response" streaming protocol 19:
  1. Maintain a counter of bytes sent.
  2. Subtract bytes from the counter when an ok response is received from the controller.
  3. Only send the next line of GCode if the buffer has space.
  4. Support "Real-Time" commands: Status queries (?), Feed Hold (\!), and Cycle Start (\~) must be sent immediately, bypassing the queue.20

### **6.2 GCode Generation Logic**

The engine must convert the visual vector paths into GCode text.

- **Motion Modes:** G0 for rapid travel (laser off), G1 for cutting (laser on).21
- **Power Control:** LightBurn uses M4 (Dynamic Power) for GRBL 1.1+, which scales laser power with speed to prevent burned corners. Older controllers use M3 (Constant Power). The software must detect the firmware version and select the appropriate command.1
- **Arc Support:** To reduce file size and improve smoothness, the generator should detect curves and output G2/G3 arc commands rather than thousands of tiny linear G1 segments.
- **Overscanning:** For raster engraving, the GCode generator must add extra travel lines past the image edge. This allows the laser head to decelerate _after_ the cut, ensuring the engraving speed is constant across the entire image width. The math involves calculating the required acceleration distance based on the requested speed and the machine's acceleration settings ($120, $121).22

### **6.3 Air Assist and Peripherals**

The "Layer" settings include an "Air Assist" toggle.

- **Command Injection:** When generating GCode for a layer with Air Assist enabled, the generator injects M8 (or M7) at the start of the layer and M9 to turn it off at the end. The specific command (M7 vs M8) should be configurable in Device Settings, as implementations vary between boards.23

## ---

**7\. Laser Control: DSP Systems (Ruida)**

Ruida controllers are prevalent in higher-end CO2 lasers. They do not use GCode, instead utilizing a proprietary binary protocol.

### **7.1 Protocol Architecture**

Support for Ruida requires reverse-engineering the binary communication format (often stored as .rd files).

- **Packet Structure:** The protocol uses command bytes (e.g., 0x88 for Move, 0xA0 for Laser On). Every packet includes a 16-bit checksum that must be calculated by the software to ensure integrity.25
- **Swizzling:** Ruida data is often obfuscated or "swizzled" (bit-shifted) to prevent unauthorized software use. The web app must implement the specific un-swizzling algorithms for various Ruida models (6442, 6445, etc.).25

### **7.2 The Ethernet Bridge Solution**

As established, browsers cannot open UDP sockets, which is how Ruida controllers communicate over Ethernet (port 50200).

- **Architecture:** The solution is a **local relay application** (The "Bridge").
  - **Frontend:** The web app connects to ws://localhost:port.
  - **Bridge:** A small executable listening on that WebSocket port. It receives commands from the browser and forwards them as raw UDP packets to the laser's static IP address (e.g., 192.168.1.100).11
  - **Feedback:** The Bridge listens for UDP responses (position data, job status) and pushes them back to the browser via the WebSocket for the UI to display.26

### **7.3 Transfer Modes**

- **File Transfer:** The user sends the entire job to the laser's memory. The browser compiles the binary blob, sends it to the Bridge, which uploads it.
- **Immediate Execution:** The user clicks "Start." The browser streams packets in real-time, managing the buffer flow control logic required by the DSP controller.1

## ---

**8\. Laser Control: Galvo Systems (EZCAD)**

Galvo lasers use mirrors to steer the beam and require entirely different control logic.

### **8.1 The LMC Protocol**

EZCAD-based fiber lasers use the LMC (Laser Marking Card) protocol over USB.

- **Bulk Transfer:** Unlike serial streaming, this involves sending large blocks of vector data (lists of coordinates) to the controller's buffer via USB Bulk endpoints.27
- **WebUSB Implementation:** The web application uses navigator.usb to find the device (Vendor ID 0x9588 is common for BJJCZ boards). It opens the device, claims the interface, and sends the binary command lists.28

### **8.2 Geometric Correction (Markcfg7)**

Galvo mirrors inherently distort the image (pincushion distortion).

- **Calibration File:** The user must import the markcfg7 file provided with the machine. This file contains a 9-point correction table.
- **Warping Algorithm:** The software must parse this file and apply a bi-linear or polynomial warping transformation to every coordinate _before_ sending it to the laser. This ensures that a square drawn on the screen marks as a square on the material.29

### **8.3 Timing Management**

Galvo lasers are incredibly fast and sensitive to timing.

- **Delays:** The protocol includes specific parameters for "Laser On Delay," "Laser Off Delay," and "Polygon Delay" to account for the physical lag of the mirrors. If these are not handled correctly, corners will be burned or disconnected. The web app must define these parameters in the device settings and embed them into the instruction list sent to the card.30

## ---

**9\. Advanced Integration Features**

### **9.1 Camera Integration**

The Camera Control feature allows users to see the laser bed and position designs visually.1

- **Video Access:** Use navigator.mediaDevices.getUserMedia to access the USB camera stream.
- **Lens Calibration:** Laser cameras use wide-angle (fisheye) lenses. The software must implement a calibration wizard. The user holds a dot-pattern card; the software uses OpenCV.js (WASM) to detect the dot centers and calculate the **Camera Matrix** and **Distortion Coefficients**.31 These coefficients are used to "undistort" the video feed in real-time.
- **Alignment:** The user marks four target points on the bed. The software calculates a **Homography Matrix** (perspective transform) to map the camera's pixel coordinates to the laser's physical millimeter coordinates.32 The video element is then transformed (CSS3D or WebGL) to overlay perfectly on the grid.

### **9.2 Rotary Attachment**

Rotary mode translates Y-axis movement into rotation for cylindrical objects.1

- **Configuration:** The user inputs the "Steps per Rotation" and "Object Diameter."
- Calculation: The GCode generator intercepts all Y-axis moves. It converts the linear distance (mm) into rotational steps using the formula:

  $$\\text{Steps} \= \\frac{\\text{Distance}}{\\pi \\times \\text{Diameter}} \\times \\text{Steps per Rotation}$$

- **Output:** The software outputs commands to the A-axis (or re-mapped Y-axis) based on this calculation.33

### **9.3 Variable Text and Serialization**

For batch processing (e.g., making 100 name tags), the software needs dynamic text.1

- **CSV Parsing:** The app uses the File System Access API to read a local CSV file.
- **Virtual Arrays:** A "Virtual Array" tool replicates the design. For each copy, the software substitutes text variables (e.g., %0, %1) with data from the corresponding CSV row. This happens at generation time, creating a massive single job stream containing unique names for every instance.1

### **9.4 Print and Cut**

This feature aligns laser cuts to pre-printed graphics using optical registration marks.1

- **Workflow:** The user prints a design with two crosshair marks. They place it in the laser and jog the head to the first crosshair, then the second.
- **Transformation:** The software records the physical positions of these two points. It compares them to the design coordinates to calculate:
  1. **Scale:** Did the printer shrink/stretch the image?
  2. **Rotation:** Is the paper askew?
  3. **Translation:** Where is it on the bed?
- **Affine Transform:** The software applies a matrix transformation to the entire cut path to match the physical orientation of the print exactly before sending the GCode.7

## ---

**10\. Data Persistence and Material Library**

A professional tool requires saving state and settings.

- **Material Library:** Storing cut settings for specific materials (e.g., "3mm Plywood"). This is best implemented using **IndexedDB**, a transactional database built into the browser. It allows storing structured JSON objects defining speed, power, and interval for hierarchically organized materials.34
- **File Handling:** The **File System Access API** is crucial. It allows the web app to "Save" and "Open" files directly to the user's hard drive without the clunky "Download" behavior of traditional web forms. This enables a native-like "Ctrl+S" experience.35

## ---

**11\. Conclusion**

Replicating LightBurn in a browser is a monumental engineering task, but technically feasible with modern web APIs. The convergence of Web Serial, WebUSB, and WebAssembly allows the browser to break out of its historical sandbox and control industrial hardware with high precision.

The primary challenges lie not in the UI, but in the robust handling of hardware protocols—specifically the non-standardized nature of GCode implementations and the proprietary obfuscation of DSP/Galvo controllers. Success depends on building a hybrid architecture: a responsive React/Vue frontend backed by a high-performance WASM geometry engine (Clipper2/OpenCV) and a reliable local bridge service for network communication. This approach ensures that the web-based alternative can deliver the sub-millimeter precision and real-time responsiveness required by professional fabricators.

## ---

**12\. Feature Implementation Summary Table**

| Feature Category | LightBurn Feature    | Web Implementation Strategy        | Critical Libraries/APIs    |
| :--------------- | :------------------- | :--------------------------------- | :------------------------- |
| **Core**         | **Vector Rendering** | WebGL/WebGPU for 20k+ paths.       | Three.js / Pixi.js         |
|                  | **Boolean Ops**      | Polygon clipping (Union/Diff).     | Clipper2 (WASM)            |
|                  | **Offsetting**       | Parallel contour generation.       | ClipperOffset (WASM)       |
| **Imaging**      | **Dithering**        | Error diffusion (Floyd-Steinberg). | Web Workers \+ ImageData   |
|                  | **Tracing**          | Bitmap to Vector conversion.       | Potrace (WASM)             |
| **Control**      | **GCode Streaming**  | Buffer-aware serial streaming.     | navigator.serial           |
|                  | **Ruida/DSP**        | UDP Proxy via Local Bridge.        | WebSocket \+ Local Service |
|                  | **Galvo**            | Bulk USB Transfer \+ Correction.   | navigator.usb              |
| **Advanced**     | **Camera**           | Calibration/Alignment.             | OpenCV.js, getUserMedia    |
|                  | **Rotary**           | Axis re-mapping logic.             | GCode Generator Logic      |
|                  | **Variable Text**    | CSV Parsing & Dynamic Text.        | PapaParse                  |
|                  | **Material Lib**     | Persistent settings storage.       | IndexedDB                  |
|                  | **Print & Cut**      | Affine Transformation.             | Matrix Math Library        |

#### **Works cited**

1. LightBurn2.0.pdf
2. ClipperOffset \- angusj.com, accessed January 5, 2026, [http://www.angusj.com/clipper2/Docs/Units/Clipper.Offset/Classes/ClipperOffset/\_Body.htm](http://www.angusj.com/clipper2/Docs/Units/Clipper.Offset/Classes/ClipperOffset/_Body.htm)
3. Clipper2 \- Polygon Clipping Offsetting & Triangulating \- angusj.com, accessed January 5, 2026, [https://www.angusj.com/clipper2/Docs/Overview.htm](https://www.angusj.com/clipper2/Docs/Overview.htm)
4. Real-Time Video Processing with WebCodecs and Streams: Processing Pipelines (Part 1), accessed January 5, 2026, [https://webrtchacks.com/real-time-video-processing-with-webcodecs-and-streams-processing-pipelines-part-1/](https://webrtchacks.com/real-time-video-processing-with-webcodecs-and-streams-processing-pipelines-part-1/)
5. Transformations \- Web APIs | MDN, accessed January 5, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Transformations)
6. Web Serial API \- GitHub Pages, accessed January 5, 2026, [https://wicg.github.io/serial/](https://wicg.github.io/serial/)
7. Read from and write to a serial port | Capabilities \- Chrome for Developers, accessed January 5, 2026, [https://developer.chrome.com/docs/capabilities/serial](https://developer.chrome.com/docs/capabilities/serial)
8. WebUSB API \- GitHub Pages, accessed January 5, 2026, [https://wicg.github.io/webusb/](https://wicg.github.io/webusb/)
9. Access USB Devices on the Web | Capabilities \- Chrome for Developers, accessed January 5, 2026, [https://developer.chrome.com/docs/capabilities/usb](https://developer.chrome.com/docs/capabilities/usb)
10. EZCAD2 SOFTWARE AND CONTROLLER CARD DRIVER INSTALLATION / DANIEL, accessed January 5, 2026, [https://bescutter.zohodesk.com/portal/en/kb/articles/install-ezcad2](https://bescutter.zohodesk.com/portal/en/kb/articles/install-ezcad2)
11. Ethernet Connection (Ruida) \- LightBurn Documentation, accessed January 5, 2026, [https://docs.lightburnsoftware.com/Guides/Ruida-Ethernet.html](https://docs.lightburnsoftware.com/Guides/Ruida-Ethernet.html)
12. How do I connect a Ruida controller with Ethernet? \- Resources \- LightBurn Software Forum, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/how-do-i-connect-a-ruida-controller-with-ethernet/7672](https://forum.lightburnsoftware.com/t/how-do-i-connect-a-ruida-controller-with-ethernet/7672)
13. Javascript Clipper / Wiki / documentation \- SourceForge, accessed January 5, 2026, [https://sourceforge.net/p/jsclipper/wiki/documentation/](https://sourceforge.net/p/jsclipper/wiki/documentation/)
14. floyd-steinberg \- NPM, accessed January 5, 2026, [https://www.npmjs.com/package/floyd-steinberg](https://www.npmjs.com/package/floyd-steinberg)
15. Utzel-Butzel/epdoptimize: A JavaScript library for reducing image colors and dithering them to fit (color) eInk displays with optimal visual quality. \- GitHub, accessed January 5, 2026, [https://github.com/Utzel-Butzel/epdoptimize](https://github.com/Utzel-Butzel/epdoptimize)
16. Potrace \- Wikipedia, accessed January 5, 2026, [https://en.wikipedia.org/wiki/Potrace](https://en.wikipedia.org/wiki/Potrace)
17. jankovicsandras/imagetracerjs: Simple raster image tracer and vectorizer written in JavaScript. \- GitHub, accessed January 5, 2026, [https://github.com/jankovicsandras/imagetracerjs](https://github.com/jankovicsandras/imagetracerjs)
18. Grbl v1.1 Settings Reference \- Easel Support Center, accessed January 5, 2026, [https://support.easel.com/hc/en-us/articles/40531091549971-Grbl-v1-1-Settings-Reference](https://support.easel.com/hc/en-us/articles/40531091549971-Grbl-v1-1-Settings-Reference)
19. GCode Senders | Wiki.js \- FluidNC, accessed January 5, 2026, [http://wiki.fluidnc.com/en/support/gcode_senders](http://wiki.fluidnc.com/en/support/gcode_senders)
20. grbl/doc/markdown/commands.md at master \- GitHub, accessed January 5, 2026, [https://github.com/gnea/grbl/blob/master/doc/markdown/commands.md](https://github.com/gnea/grbl/blob/master/doc/markdown/commands.md)
21. Grbl V1.1 Quick Reference \- SainSmart.com, accessed January 5, 2026, [https://www.sainsmart.com/blogs/news/grbl-v1-1-quick-reference](https://www.sainsmart.com/blogs/news/grbl-v1-1-quick-reference)
22. GRBL Settings \- Pocket Guide \- DIY Machining, accessed January 5, 2026, [https://www.diymachining.com/downloads/GRBL_Settings_Pocket_Guide_Rev_B.pdf](https://www.diymachining.com/downloads/GRBL_Settings_Pocket_Guide_Rev_B.pdf)
23. How to Use M7 M8 \- NEJE Wiki, accessed January 5, 2026, [https://wiki.neje99.com/en/manual/m7m8](https://wiki.neje99.com/en/manual/m7m8)
24. M8 Doesn't seem to be working from gcode | MASSO Community Forums, accessed January 5, 2026, [https://forums.masso.com.au/threads/m8-doesnt-seem-to-be-working-from-gcode.3519/](https://forums.masso.com.au/threads/m8-doesnt-seem-to-be-working-from-gcode.3519/)
25. Ruida \- EduTech Wiki, accessed January 5, 2026, [https://edutechwiki.unige.ch/en/Ruida](https://edutechwiki.unige.ch/en/Ruida)
26. Sending basic commands via UDP to Ruida \- \#11 by ClayJar \- LightBurn Software Forum, accessed January 5, 2026, [https://forum.lightburnsoftware.com/t/sending-basic-commands-via-udp-to-ruida/166604/11](https://forum.lightburnsoftware.com/t/sending-basic-commands-via-udp-to-ruida/166604/11)
27. Fiber Laser Engravers \- Bryce Schroeder, accessed January 5, 2026, [https://www.bryce.pw/engraver.html](https://www.bryce.pw/engraver.html)
28. LMCV4-FIBER-M \- EduTech Wiki, accessed January 5, 2026, [https://edutechwiki.unige.ch/en/LMCV4-FIBER-M](https://edutechwiki.unige.ch/en/LMCV4-FIBER-M)
29. Galvo Setup \- LightBurn Documentation, accessed January 5, 2026, [https://docs.lightburnsoftware.com/galvo/Setup.html](https://docs.lightburnsoftware.com/galvo/Setup.html)
30. meerk40t/galvoplotter: low level command system for ezcad2 lmc-controller galvo lasers, accessed January 5, 2026, [https://github.com/meerk40t/galvoplotter](https://github.com/meerk40t/galvoplotter)
31. Camera Calibration \- OpenCV, accessed January 5, 2026, [https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html](https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html)
32. Geometric Transformations of Images \- OpenCV Documentation, accessed January 5, 2026, [https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html](https://docs.opencv.org/3.4/dd/d52/tutorial_js_geometric_transformations.html)
33. Rotary Lasercutter Axis \- Instructables, accessed January 5, 2026, [https://www.instructables.com/Rotary-Lasercutter-Axis/](https://www.instructables.com/Rotary-Lasercutter-Axis/)
34. DITHR Tool \- Antlii.work, accessed January 5, 2026, [https://antlii.work/DITHR-Tool](https://antlii.work/DITHR-Tool)
35. Building QuickCap \- A Loom Alternative with WebRTC and Canvas Composition, accessed January 5, 2026, [https://dalenguyen.me/blog/2025-10-11-building-quickcap-loom-alternative-webrtc-canvas-composition](https://dalenguyen.me/blog/2025-10-11-building-quickcap-loom-alternative-webrtc-canvas-composition)
