import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_places_flutter/google_places_flutter.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../app_state.dart';

class AddComplaintPage extends StatefulWidget {
  const AddComplaintPage({super.key});

  @override
  State<AddComplaintPage> createState() => _AddComplaintPageState();
}

class _AddComplaintPageState extends State<AddComplaintPage> {
  final String googleApiKey = "YOUR_GOOGLE_MAPS_API_KEY";

  GoogleMapController? _mapController;
  final FocusNode _searchFocusNode = FocusNode();

  LatLng? selectedLatLng;
  String selectedAddress = "Fetching address...";

  final TextEditingController landmarkController = TextEditingController();
  final TextEditingController otherIssueController = TextEditingController();

  String selectedComplaint = "Dustbin overflow";

  final List<String> complaintOptions = [
    "Dustbin overflow",
    "Dirty washroom",
    "Spillage",
    "Other",
  ];

  @override
  void initState() {
    super.initState();
    _setCurrentLocation();
  }

  // ---------------- LOCATION ----------------

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
    }

    setState(() {});
  }

  // ---------------- SUBMIT ----------------

  Future<void> _submitComplaint() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || selectedLatLng == null) return;

    final issue = selectedComplaint == "Other"
        ? otherIssueController.text.trim()
        : selectedComplaint;

    if (issue.isEmpty) return;

    await FirebaseFirestore.instance
        .collection('complaints')
        .add({
      'userId': user.uid,
      'issue': issue,
      'address': selectedAddress,
      'landmark': landmarkController.text.trim(),
      'latitude': selectedLatLng!.latitude,
      'longitude': selectedLatLng!.longitude,
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });

    AppState.selectedAddress = selectedAddress;
    AppState.landmark = landmarkController.text;
    AppState.complaintType = issue;

    Navigator.pop(context);
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
            // 🔍 SEARCH
            Padding(
              padding: const EdgeInsets.all(12),
              child: GooglePlaceAutoCompleteTextField(
                textEditingController: TextEditingController(),
                focusNode: _searchFocusNode,
                googleAPIKey: googleApiKey,
                debounceTime: 800,
                countries: const ["in"],
                isLatLngRequired: true,
                inputDecoration: InputDecoration(
                  hintText: "Search location",
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
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

            // 🗺️ MAP
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

            // 📍 ADDRESS DISPLAY
            Padding(
              padding: const EdgeInsets.all(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  selectedAddress,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),

            // 🧾 ISSUE TYPE DROPDOWN
            Padding(
              padding: const EdgeInsets.all(12),
              child: DropdownButtonFormField<String>(
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

            // ✏️ OTHER ISSUE TEXT
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

            // 🏷️ LANDMARK
            Padding(
              padding: const EdgeInsets.all(12),
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

            // ✅ SUBMIT
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _submitComplaint,
                  child: const Text("Submit Complaint"),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    landmarkController.dispose();
    otherIssueController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }
}
