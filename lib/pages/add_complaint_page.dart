import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_places_flutter/google_places_flutter.dart';


import '../app_state.dart';

class AddComplaintPage extends StatefulWidget {
  const AddComplaintPage({super.key});

  @override
  State<AddComplaintPage> createState() => _AddComplaintPageState();
}

class _AddComplaintPageState extends State<AddComplaintPage> {
  final String googleApiKey = "AIzaSyDlsmrFO14h_f96HnzdBeJRQyH3DJfc27g";
  final FocusNode _searchFocusNode = FocusNode();
  final TextEditingController addressController = TextEditingController();
  String selectedComplaint = "Dustbin overflow";

final TextEditingController otherIssueController =
    TextEditingController();

final List<String> complaintOptions = [
  "Dustbin overflow",
  "Dirty washroom",
  "Spillage",
  "Other",
];




  GoogleMapController? _mapController;

  LatLng? selectedLatLng;
  String selectedAddress = "Fetching address...";

  final TextEditingController landmarkController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _setCurrentLocation();
  }

  // ---------------- LOCATION SETUP ----------------

  Future<void> _setCurrentLocation() async {
    await Geolocator.requestPermission();

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    _updateLocation(
      LatLng(position.latitude, position.longitude),
    );
  }

  Future<void> _updateLocation(LatLng latLng) async {
    selectedLatLng = latLng;

    _mapController?.animateCamera(
      CameraUpdate.newLatLng(latLng),
    );

    final placemarks = await placemarkFromCoordinates(
      latLng.latitude,
      latLng.longitude,
    );

    if (placemarks.isNotEmpty) {
      final p = placemarks.first;
      selectedAddress =
    "${p.name}, ${p.locality}, ${p.administrativeArea}";

addressController.text = selectedAddress;

    }

    setState(() {});
  }

  // ---------------- UI ----------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
  resizeToAvoidBottomInset: true,
  appBar: AppBar(title: const Text("Add Complaint")),
  body: SingleChildScrollView(
    padding: EdgeInsets.only(
      bottom: MediaQuery.of(context).viewInsets.bottom,
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 🔍 Search box
        Padding(
          padding: const EdgeInsets.all(12),
          child: GooglePlaceAutoCompleteTextField(
            textEditingController: TextEditingController(),
            focusNode: _searchFocusNode,
            googleAPIKey: googleApiKey,
            inputDecoration: InputDecoration(
              hintText: "Search location",
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            debounceTime: 800,
            countries: const ["in"],
            isLatLngRequired: true,
            getPlaceDetailWithLatLng: (prediction) {
              final lat = double.parse(prediction.lat!);
              final lng = double.parse(prediction.lng!);
              _updateLocation(LatLng(lat, lng));
              FocusScope.of(context).unfocus();
            },
            itemClick: (prediction) {
              FocusScope.of(context).unfocus();
            },
          ),
        ),

        // 🗺️ Map (FIXED HEIGHT)
        SizedBox(
          height: 300,
          child: selectedLatLng == null
              ? const Center(child: CircularProgressIndicator())
              : GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: selectedLatLng!,
                    zoom: 16,
                  ),
                  onMapCreated: (controller) =>
                      _mapController = controller,
                  myLocationEnabled: true,
                  onTap: (pos) {
                    FocusScope.of(context).unfocus();
                    _updateLocation(pos);
                  },
                  markers: {
                    Marker(
                      markerId: const MarkerId("selected"),
                      position: selectedLatLng!,
                    ),
                  },
                ),
        ),

        // 📍 Address
        Padding(
  padding: const EdgeInsets.all(12),
  child: Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      border: Border.all(color: Colors.grey),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Text(
      selectedAddress.isEmpty
          ? "Fetching address..."
          : selectedAddress,
      style: const TextStyle(fontSize: 14),
    ),
  ),
),



        // 🏷️ Landmark
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: TextField(
            controller: landmarkController,
            decoration: InputDecoration(
              labelText: "Nearby landmark (optional)",
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),


        // Dropdown
        Padding(
  padding: const EdgeInsets.all(12),
  child: DropdownButtonFormField<String>(
    // ignore: deprecated_member_use
    value: selectedComplaint,
    decoration: InputDecoration(
      labelText: "Issue Type",
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    items: complaintOptions
        .map(
          (item) => DropdownMenuItem(
            value: item,
            child: Text(item),
          ),
        )
        .toList(),
    onChanged: (value) {
      setState(() {
        selectedComplaint = value!;
      });
    },
  ),
),
if (selectedComplaint == "Other")
  Padding(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: TextField(
      controller: otherIssueController,
      decoration: InputDecoration(
        labelText: "Describe the issue",
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),
  ),


        // ✅ Submit
        Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            height: 50,
            child: ElevatedButton(
              onPressed: () {
  AppState.selectedAddress = selectedAddress;
  AppState.landmark = landmarkController.text;

  AppState.complaintType =
      selectedComplaint == "Other"
          ? otherIssueController.text
          : selectedComplaint;

  Navigator.pop(context, {
    "address": selectedAddress,
    "landmark": landmarkController.text,
    "issue": AppState.complaintType,
    "lat": selectedLatLng?.latitude,
    "lng": selectedLatLng?.longitude,
  });
},

              child: const Text("Summit"),
            ),
          ),
        ),
      ],
    ),
  ),
);

  }
}
