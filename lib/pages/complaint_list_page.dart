import 'package:flutter/material.dart';
import 'add_complaint_page.dart';

class ComplaintListPage extends StatefulWidget {
  const ComplaintListPage({super.key});

  @override
  State<ComplaintListPage> createState() => _ComplaintListPageState();
}

class _ComplaintListPageState extends State<ComplaintListPage> {
  final List<String> complaints = [
    "Complaint 1",
    "Complaint 2",
    "Complaint 3",
  ];

  void addComplaint(String complaint) {
    setState(() {
      complaints.add(complaint);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Complaints")),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.add),
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const AddComplaintPage(),
            ),
          );

          if (result != null) {
            addComplaint(result);
          }
        },
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: complaints.length,
        itemBuilder: (context, index) {
          return ComplaintCard(title: complaints[index]);
        },
      ),
    );
  }
}

class ComplaintCard extends StatelessWidget {
  final String title;

  const ComplaintCard({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: const [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "COMPLAINT",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 4),
              Text(
                "DETAILS",
                style: TextStyle(color: Colors.white70),
              ),
            ],
          ),
          Icon(Icons.chevron_right, color: Colors.white),
        ],
      ),
    );
  }
}
