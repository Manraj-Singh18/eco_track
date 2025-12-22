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

  LatLng? _selectedLatLng;
  String _selectedAddress = "Fetching address...";

  final TextEditingController _landmarkController = TextEditingController();
  final TextEditingController _otherIssueController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  bool _isSubmitting = false;

  String _selectedComplaint = "Dustbin overflow";

  final List<String> _complaintOptions = [
    "Dustbin overflow",
    "Dirty washroom",
    "Spillage",
    "Other",
  ];

  // ---------------- LIFECYCLE ----------------

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  @override
  void dispose() {
    _landmarkController.dispose();
    _otherIssueController.dispose();
    _searchController.dispose();
    _searchFocusNode.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  // ---------------- LOCATION ----------------

  Future<void> _initLocation() async {
    await Geolocator.requestPermission();

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    await _updateLocation(
      LatLng(position.latitude, position.longitude),
    );
  }

  Future<void> _updateLocation(LatLng latLng) async {
    _selectedLatLng = latLng;

    _mapController?.animateCamera(
      CameraUpdate.newLatLng(latLng),
    );

    final placemarks = await placemarkFromCoordinates(
      latLng.latitude,
      latLng.longitude,
    );

    if (placemarks.isNotEmpty) {
      final p = placemarks.first;
      _selectedAddress =
          "${p.name}, ${p.locality}, ${p.administrativeArea}";
    }

    if (!mounted) return;
    setState(() {});
  }

  // ---------------- SUBMIT ----------------

  Future<void> _submitComplaint() async {
    if (_isSubmitting) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null || _selectedLatLng == null) return;

    final issue = _selectedComplaint == "Other"
        ? _otherIssueController.text.trim()
        : _selectedComplaint;

    if (issue.isEmpty) return;

    setState(() => _isSubmitting = true);

    try {
      await FirebaseFirestore.instance.collection('complaints').add({
        'userId': user.uid,
        'issue': issue,
        'address': _selectedAddress,
        'landmark': _landmarkController.text.trim(),
        'latitude': _selectedLatLng!.latitude,
        'longitude': _selectedLatLng!.longitude,
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (!mounted) return;

      AppState.selectedAddress = _selectedAddress;
      AppState.landmark = _landmarkController.text;
      AppState.complaintType = issue;

      Navigator.pop(context);
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
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
            _buildSearchBar(),
            _buildMap(),
            _buildAddressBox(),
            _buildIssueDropdown(),
            if (_selectedComplaint == "Other") _buildOtherIssueField(),
            _buildLandmarkField(),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  // ---------------- WIDGETS ----------------

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: GooglePlaceAutoCompleteTextField(
        textEditingController: _searchController,
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
        itemClick: (_) {
          FocusScope.of(context).unfocus();
        },
      ),
    );
  }

  Widget _buildMap() {
    return SizedBox(
      height: 300,
      child: _selectedLatLng == null
          ? const Center(child: CircularProgressIndicator())
          : GoogleMap(
              initialCameraPosition: CameraPosition(
                target: _selectedLatLng!,
                zoom: 16,
              ),
              onMapCreated: (controller) => _mapController = controller,
              myLocationEnabled: true,
              onTap: (pos) {
                FocusScope.of(context).unfocus();
                _updateLocation(pos);
              },
              markers: {
                Marker(
                  markerId: const MarkerId("selected"),
                  position: _selectedLatLng!,
                ),
              },
            ),
    );
  }

  Widget _buildAddressBox() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          _selectedAddress,
          style: const TextStyle(fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildIssueDropdown() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: DropdownButtonFormField<String>(
        initialValue: _selectedComplaint,
        decoration: InputDecoration(
          labelText: "Issue Type",
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        items: _complaintOptions
            .map(
              (item) => DropdownMenuItem(
                value: item,
                child: Text(item),
              ),
            )
            .toList(),
        onChanged: (value) {
          if (value == null) return;
          setState(() => _selectedComplaint = value);
        },
      ),
    );
  }

  Widget _buildOtherIssueField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: TextField(
        controller: _otherIssueController,
        decoration: InputDecoration(
          labelText: "Describe the issue",
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildLandmarkField() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: TextField(
        controller: _landmarkController,
        decoration: InputDecoration(
          labelText: "Nearby landmark (optional)",
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: SizedBox(
        height: 50,
        child: ElevatedButton(
          onPressed: _isSubmitting ? null : _submitComplaint,
          child: _isSubmitting
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text("Submit Complaint"),
        ),
      ),
    );
  }
}
