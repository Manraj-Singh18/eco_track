import 'dart:ui';
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
  final String googleApiKey = "AIzaSyDlsmrFO14h_f96HnzdBeJRQyH3DJfc27g";

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

  /* ---------------- LOCATION ---------------- */

  Future<void> _initLocation() async {
    await Geolocator.requestPermission();
    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
    await _updateLocation(LatLng(position.latitude, position.longitude));
  }

  Future<void> _updateLocation(LatLng latLng) async {
    _selectedLatLng = latLng;
    _mapController?.animateCamera(CameraUpdate.newLatLng(latLng));

    final placemarks =
        await placemarkFromCoordinates(latLng.latitude, latLng.longitude);
    if (placemarks.isNotEmpty) {
      final p = placemarks.first;
      _selectedAddress =
          "${p.name}, ${p.locality}, ${p.administrativeArea}";
    }

    if (mounted) setState(() {});
  }

  /* ---------------- SUBMIT ---------------- */

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

      AppState.selectedAddress = _selectedAddress;
      AppState.landmark = _landmarkController.text;
      AppState.complaintType = issue;

      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  /* ---------------- UI ---------------- */

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEFF7F3),
      resizeToAvoidBottomInset: true,

      /* ---------- GLASS APP BAR ---------- */
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        title: const Text("Add Complaint"),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1E6F5C), Color(0xFF2F9E44)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),

      body: SingleChildScrollView(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _glassSection(_buildSearchBar()),
            _glassMap(),
            _glassSection(_buildAddressBox()),
            _glassSection(_buildIssueDropdown()),
            if (_selectedComplaint == "Other")
              _glassSection(_buildOtherIssueField()),
            _glassSection(_buildLandmarkField()),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  /* ---------------- GLASS HELPERS ---------------- */

  Widget _glassSection(Widget child) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withOpacity(0.65),
                  Colors.white.withOpacity(0.35),
                ],
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.15),
                  blurRadius: 25,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  /* ---------------- WIDGETS ---------------- */

  Widget _buildSearchBar() {
    return GooglePlaceAutoCompleteTextField(
      textEditingController: _searchController,
      focusNode: _searchFocusNode,
      googleAPIKey: googleApiKey,
      debounceTime: 800,
      countries: const ["in"],
      isLatLngRequired: true,
      inputDecoration: const InputDecoration(
        hintText: "Search location",
        prefixIcon: Icon(Icons.search),
        border: InputBorder.none,
      ),
      getPlaceDetailWithLatLng: (prediction) {
        _updateLocation(
          LatLng(
            double.parse(prediction.lat!),
            double.parse(prediction.lng!),
          ),
        );
        FocusScope.of(context).unfocus();
      },
      itemClick: (_) => FocusScope.of(context).unfocus(),
    );
  }

  Widget _glassMap() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: 280,
          child: _selectedLatLng == null
              ? const Center(child: CircularProgressIndicator())
              : GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: _selectedLatLng!,
                    zoom: 16,
                  ),
                  onMapCreated: (c) => _mapController = c,
                  myLocationEnabled: true,
                  onTap: _updateLocation,
                  markers: {
                    Marker(
                      markerId: const MarkerId("selected"),
                      position: _selectedLatLng!,
                    ),
                  },
                ),
        ),
      ),
    );
  }

  Widget _buildAddressBox() {
    return Text(
      _selectedAddress,
      style: const TextStyle(fontSize: 14),
    );
  }

  Widget _buildIssueDropdown() {
    return DropdownButtonFormField<String>(
      value: _selectedComplaint,
      decoration: const InputDecoration(
        labelText: "Issue Type",
        border: InputBorder.none,
      ),
      items: _complaintOptions
          .map(
            (item) => DropdownMenuItem(
              value: item,
              child: Text(item),
            ),
          )
          .toList(),
      onChanged: (v) => setState(() => _selectedComplaint = v!),
    );
  }

  Widget _buildOtherIssueField() {
    return TextField(
      controller: _otherIssueController,
      decoration: const InputDecoration(
        labelText: "Describe the issue",
        border: InputBorder.none,
      ),
    );
  }

  Widget _buildLandmarkField() {
    return TextField(
      controller: _landmarkController,
      decoration: const InputDecoration(
        labelText: "Nearby landmark (optional)",
        border: InputBorder.none,
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.95, end: 1),
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutBack,
        builder: (context, value, child) {
          return Transform.scale(scale: value, child: child);
        },
        child: Container(
          height: 54,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2F9E44), Color(0xFF40C057)],
            ),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: Colors.green.withOpacity(0.4),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitComplaint,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: _isSubmitting
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text(
                    "Submit Complaint",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
