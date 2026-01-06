import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'add_complaint_page.dart';

class ComplaintListPage extends StatelessWidget {
  const ComplaintListPage({super.key});

  @override
  Widget build(BuildContext context) {
    precacheImage(const AssetImage('assets/image.png'), context);
    final user = FirebaseAuth.instance.currentUser!;

    return Scaffold(
      backgroundColor: const Color(0xFFEFF7F3),
      body: CustomScrollView(
        slivers: [
          /* ---------------- COLLAPSING GLASS APP BAR ---------------- */
          SliverAppBar(
            pinned: true,
            expandedHeight: 140,
            backgroundColor: Colors.transparent,
            elevation: 0,
            flexibleSpace: LayoutBuilder(
              builder: (context, constraints) {
                final collapsed =
                    constraints.biggest.height <= kToolbarHeight + 10;

                return ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(
                      sigmaX: collapsed ? 12 : 0,
                      sigmaY: collapsed ? 12 : 0,
                    ),
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF1E6F5C),
                            Color(0xFF2F9E44),
                          ],
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: Row(
                          children: [
                            const _AnimatedLogo(),
                            const SizedBox(width: 12),
                            const _GradientTitle(),
                            const Spacer(),
                            IconButton(
                              icon: const Icon(Icons.logout_rounded,
                                  color: Colors.white),
                              onPressed: () async {
                                await FirebaseAuth.instance.signOut();
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          /* ---------------- BODY ---------------- */
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('complaints')
                .where('userId', isEqualTo: user.uid)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 80),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                );
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return const SliverToBoxAdapter(child: _EmptyState());
              }

              final complaints = snapshot.data!.docs;

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final data =
                        complaints[index].data() as Map<String, dynamic>;

                    return AnimatedComplaintCard(
                      index: index,
                      issue: data['issue'] ?? 'Unknown',
                      address: data['address'] ?? 'No address',
                      landmark: data['landmark'] ?? '',
                      status: data['status'] ?? 'pending',
                    );
                  },
                  childCount: complaints.length,
                ),
              );
            },
          ),
        ],
      ),

      /* ---------------- FAB ---------------- */
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2F9E44), Color(0xFF40C057)],
          ),
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.green.withOpacity(0.35),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          backgroundColor: Colors.transparent,
          elevation: 0,
          icon: const Icon(Icons.add),
          label: const Text("Add Complaint"),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AddComplaintPage()),
            );
          },
        ),
      ),
    );
  }
}

/* ---------------- LOGO ---------------- */

class _AnimatedLogo extends StatelessWidget {
  const _AnimatedLogo();

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.9, end: 1),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        final v = value.clamp(0.0, 1.0);
        return Transform.scale(
          scale: v,
          child: Opacity(opacity: v, child: child),
        );
      },
      child: Image.asset('assets/image.png', height: 36),
    );
  }
}

/* ---------------- TITLE ---------------- */

class _GradientTitle extends StatelessWidget {
  const _GradientTitle();

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (bounds) => const LinearGradient(
        colors: [
          Color(0xFFE8F5E9),
          Color(0xFFB9F6CA),
          Color(0xFF69F0AE),
        ],
      ).createShader(bounds),
      child: const Text(
        "EcoTrack",
        style: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.4,
          color: Colors.white,
        ),
      ),
    );
  }
}

/* ---------------- EMPTY ---------------- */

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 100),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(Icons.eco_rounded, size: 52, color: Colors.green),
          SizedBox(height: 12),
          Text("No complaints yet 🌱"),
        ],
      ),
    );
  }
}

/* ---------------- CARD ---------------- */

class AnimatedComplaintCard extends StatelessWidget {
  final int index;
  final String issue;
  final String address;
  final String landmark;
  final String status;

  const AnimatedComplaintCard({
    super.key,
    required this.index,
    required this.issue,
    required this.address,
    required this.landmark,
    required this.status,
  });

  List<Color> _statusGradient() {
    switch (status.toLowerCase()) {
      case 'resolved':
        return [Color(0xFF2ECC71), Color(0xFF27AE60)];
      case 'in progress':
        return [Color(0xFF4FACFE), Color(0xFF00C6FB)];
      default:
        return [Color(0xFFFFC107), Color(0xFFFF9800)];
    }
  }

  IconData _statusIcon() {
    switch (status.toLowerCase()) {
      case 'resolved':
        return Icons.check_circle_rounded;
      case 'in progress':
        return Icons.sync_rounded;
      default:
        return Icons.hourglass_top_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 400 + index * 80),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        final v = value.clamp(0.0, 1.0);
        return Opacity(
          opacity: v,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - v)),
            child: child,
          ),
        );
      },
      child: GestureDetector(
        onLongPress: () => HapticFeedback.mediumImpact(),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withOpacity(0.65),
                      Colors.white.withOpacity(0.35),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.15),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient:
                                LinearGradient(colors: _statusGradient()),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.report_problem_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            issue,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(address),
                    if (landmark.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.place_rounded,
                              size: 16, color: Colors.green),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              landmark,
                              style: const TextStyle(
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 14),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          gradient:
                              LinearGradient(colors: _statusGradient()),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(_statusIcon(),
                                size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            Text(
                              status.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
