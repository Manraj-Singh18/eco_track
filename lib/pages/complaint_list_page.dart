import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import 'add_complaint_page.dart';

class ComplaintListPage extends StatelessWidget {
  const ComplaintListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text("User not logged in")),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("My Complaints"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),

      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.add),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const AddComplaintPage(),
            ),
          );
        },
      ),

      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('complaints')
            .where('userId', isEqualTo: user.uid)
            .orderBy('createdAt', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(
              child: Text(
                "No complaints filed yet",
                style: TextStyle(fontSize: 16),
              ),
            );
          }

          final docs = snapshot.data!.docs;

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final data = docs[index].data() as Map<String, dynamic>;

              return ComplaintCard(
                issue: data['issue'] ?? '',
                address: data['address'] ?? '',
                landmark: data['landmark'] ?? '',
                status: data['status'] ?? 'pending',
              );
            },
          );
        },
      ),
    );
  }
}

class ComplaintCard extends StatelessWidget {
  final String issue;
  final String address;
  final String landmark;
  final String status;

  const ComplaintCard({
    super.key,
    required this.issue,
    required this.address,
    required this.landmark,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final Color cardColor =
        status == 'resolved' ? Colors.green : Colors.orange;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            issue.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            address,
            style: const TextStyle(color: Colors.white),
          ),
          if (landmark.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              "Landmark: $landmark",
              style: const TextStyle(color: Colors.white70),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            "Status: $status",
            style: const TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }
}
