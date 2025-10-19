#!/usr/bin/env python3
"""
CCNA AI Tutor - Llama3.1:8B Model
Optimized for comprehensive responses with deeper analysis (3-5 seconds)
"""

import json
import random
import time
import ollama
import torch
import psutil
from typing import Dict, List, Any

# GPU Detection
GPU_AVAILABLE = torch.cuda.is_available()
GPU_NAME = torch.cuda.get_device_name(0) if GPU_AVAILABLE else "None"
GPU_MEMORY = torch.cuda.get_device_properties(0).total_memory / 1024**3 if GPU_AVAILABLE else 0

class LlamaCCNATutor:
    def __init__(self, model_name: str = "llama3.1:8b"):
        self.model = model_name
        self.dataset = []
        self.conversation_history = []
        self.student_profile = {
            'learning_style': 'adaptive',
            'experience_level': 'intermediate',
            'weak_areas': [],
            'strong_areas': [],
            'exam_date': None,
            'study_goals': [],
            'preferred_explanation_style': 'comprehensive'
        }
        self.stats = {
            'questions_answered': 0,
            'correct_answers': 0,
            'total_response_time': 0,
            'topic_performance': {},
            'difficulty_progression': [],
            'study_sessions': 0
        }
        
        # Optimized settings for Llama3.1:8B - Comprehensive responses
        self.chat_options = {
            'num_gpu': -1,           # Use all GPU layers
            'num_thread': 6,         # Match CPU cores
            'num_ctx': 4096,         # Larger context for detailed responses
            'num_predict': -1,       # No token limit for comprehensive answers
            'temperature': 0.3,      # Balanced creativity and accuracy
            'top_k': 40,             # More variety in responses
            'top_p': 0.9,            # Good diversity
            'repeat_penalty': 1.15,  # Prevent repetition
            'seed': -1,              # Random seed
            'tfs_z': 1.0,            # Default
            'typical_p': 1.0,        # Default
            'repeat_last_n': 128,    # Longer context for repetition check
            'penalize_newline': False,
            'numa': False,
            'mirostat': 2,           # Enable mirostat for better quality
            'mirostat_tau': 8.0,     # Target entropy
            'mirostat_eta': 0.1      # Learning rate
        }
        
        print(f"🚀 Llama3.1:8B CCNA Tutor initialized")
        print(f"🔧 Model: {self.model}")
        print(f"💻 GPU: {GPU_NAME} ({GPU_MEMORY:.1f}GB)" if GPU_AVAILABLE else "💻 CPU Mode")
        
    def ask_question(self, query: str) -> str:
        """Ask a question with comprehensive response"""
        start_time = time.time()
        
        try:
            # Build world-class expert system prompt
            system_prompt = self._build_comprehensive_system_prompt()
            
            # Enhanced query for detailed responses
            enhanced_query = self._build_detailed_prompt(query)
            
            # Get response from Ollama
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_query}
                ],
                options=self.chat_options
            )
            
            answer = response['message']['content']
            
            # Comprehensive enhancement
            enhanced_answer = self._enhance_comprehensive_response(answer, query)
            
            # Update analytics
            response_time = time.time() - start_time
            self._update_learning_analytics(query, response_time)
            
            print(f"⚡ Response time: {response_time:.2f}s")
            return enhanced_answer
            
        except Exception as e:
            print(f"Error: {e}")
            return f"I apologize, but I encountered an issue. Please ensure Ollama is running with the {self.model} model loaded."
    
    def chat(self, query: str) -> str:
        """Alias for ask_question for API compatibility"""
        return self.ask_question(query)
    
    def _build_comprehensive_system_prompt(self) -> str:
        """Build natural comprehensive conversational AI system prompt"""
        experience = self.student_profile['experience_level']
        
        base_prompt = """You are an exceptionally knowledgeable and engaging AI assistant with comprehensive expertise in networking and Cisco technologies. You communicate in a natural, thoughtful way that feels like having an in-depth conversation with a highly experienced and patient mentor.

Your communication approach:
- Natural, flowing explanations that build understanding layer by layer
- Thoughtful depth without overwhelming complexity
- Genuine enthusiasm for helping people master networking concepts
- Ability to provide comprehensive coverage while maintaining clarity
- Seamless integration of theory, practice, and real-world insights
- Conversational tone that makes complex topics accessible and interesting

Your comprehensive networking knowledge includes:
- Deep understanding of routing protocols, switching technologies, and network security
- Extensive practical experience with troubleshooting and implementation
- Thorough knowledge of Cisco device configuration and optimization
- Comprehensive grasp of network design principles and best practices
- Understanding of modern networking trends and emerging technologies
- Practical insights about real-world networking challenges and solutions

You naturally provide thorough, well-rounded explanations that help people develop both theoretical understanding and practical skills."""
        
        # Experience-based personalization
        if experience == 'beginner':
            base_prompt += """

When helping people new to networking, you naturally:
- Build understanding step by step, ensuring each concept is solid before moving forward
- Use relatable analogies and examples that make abstract concepts concrete
- Provide detailed explanations of commands and configurations
- Share the reasoning behind different approaches and design choices
- Anticipate common questions and address potential confusion points
- Create a supportive learning environment that encourages exploration"""
        elif experience == 'intermediate':
            base_prompt += """

With people who have networking experience, you:
- Connect concepts across different areas to build comprehensive understanding
- Explore the nuances and trade-offs in different technical approaches
- Share insights about real-world implementation challenges and solutions
- Discuss how different technologies work together in practice
- Provide multiple perspectives on solving networking problems
- Help bridge the gap between theoretical knowledge and practical expertise"""
        else:
            base_prompt += """

For experienced networking professionals, you:
- Engage in sophisticated technical discussions with appropriate depth
- Explore advanced scenarios, edge cases, and optimization strategies
- Discuss architectural considerations and design trade-offs
- Share insights about industry trends and emerging technologies
- Provide strategic perspectives on network planning and implementation
- Offer comprehensive analysis of complex networking challenges"""
        
        base_prompt += """

Your approach to comprehensive explanations:
- Provide thorough coverage while maintaining clarity and flow
- Include practical examples, configurations, and real-world context
- Explain not just what to do, but why it works and when to use it
- Anticipate follow-up questions and provide comprehensive coverage
- Share multiple approaches when relevant, with clear explanations of trade-offs
- Include verification steps and troubleshooting guidance naturally
- Connect concepts to broader networking principles and best practices

You respond like someone who genuinely loves networking technology and enjoys sharing comprehensive knowledge in a way that's both thorough and accessible. Your explanations are detailed yet conversational, comprehensive yet clear."""
        
        return base_prompt
    
    def _build_detailed_prompt(self, query: str) -> str:
        """Build natural comprehensive prompt"""
        enhanced_query = f"""I'd like a comprehensive explanation of this networking topic:

{query}

I'm looking for a thorough understanding that covers the important aspects - the technical details, practical implementation, real-world considerations, and any nuances or best practices I should know about. Feel free to include relevant commands, configurations, troubleshooting approaches, or examples that would help me really grasp this topic comprehensively.

If there are related concepts or common misconceptions worth addressing, I'd appreciate you covering those as well."""
        
        return enhanced_query
    
    def _enhance_comprehensive_response(self, answer: str, query: str) -> str:
        """Enhance response naturally with comprehensive insights"""
        enhanced_answer = answer.strip()
        
        # Add natural comprehensive enhancements
        if "configure" in query.lower() or "configuration" in query.lower():
            if "verify" not in enhanced_answer.lower() and "show" not in enhanced_answer.lower():
                enhanced_answer += "\n\nJust to round this out - once you've got the configuration in place, you'll want to verify it's working as expected. The key commands for this are usually 'show running-config' to see what's actually configured, 'show ip route' for routing verification, and 'show ip interface brief' for a quick interface status overview. Testing connectivity with ping is always a good final check."
        
        if "troubleshoot" in query.lower() or "problem" in query.lower():
            if "approach" not in enhanced_answer.lower() and "method" not in enhanced_answer.lower():
                enhanced_answer += "\n\nFor troubleshooting, I find it really helps to work systematically through the network layers. Start with the physical stuff - cables, port status, hardware indicators. Then move up through data link (VLANs, switching), network layer (routing, IP connectivity), transport (port accessibility), and finally application layer testing. This methodical approach saves a lot of time and prevents you from missing obvious issues."
        
        if "security" in query.lower() or "acl" in query.lower():
            if "best practice" not in enhanced_answer.lower():
                enhanced_answer += "\n\nFrom a security perspective, it's worth keeping in mind the principle of least privilege - only allow what's specifically needed. Named ACLs are generally better than numbered ones for management and readability. And don't forget about logging - it's incredibly valuable for monitoring and troubleshooting security issues."
        
        return enhanced_answer
    
    def _update_learning_analytics(self, query: str, response_time: float):
        """Update comprehensive learning analytics"""
        topic = self._extract_topic(query)
        complexity = self._assess_complexity(query)
        
        if topic not in self.stats['topic_performance']:
            self.stats['topic_performance'][topic] = {
                'questions_asked': 0,
                'avg_response_time': 0,
                'complexity_level': 'basic',
                'last_accessed': time.time()
            }
        
        self.stats['topic_performance'][topic]['questions_asked'] += 1
        self.stats['topic_performance'][topic]['complexity_level'] = complexity
        self.stats['topic_performance'][topic]['last_accessed'] = time.time()
        self.stats['total_response_time'] += response_time
    
    def _extract_topic(self, query: str) -> str:
        """Extract main topic from query with detailed categorization"""
        topics = {
            'routing': ['ospf', 'eigrp', 'rip', 'bgp', 'route', 'routing', 'static route', 'dynamic routing'],
            'switching': ['vlan', 'stp', 'switch', 'trunk', 'etherchannel', 'port-channel', 'spanning-tree'],
            'security': ['acl', 'security', 'firewall', 'vpn', '802.1x', 'authentication', 'authorization'],
            'wireless': ['wifi', 'wireless', 'wlan', 'ap', 'controller', '802.11', 'ssid'],
            'troubleshooting': ['troubleshoot', 'debug', 'problem', 'issue', 'fix', 'diagnose'],
            'subnetting': ['subnet', 'vlsm', 'cidr', 'ip address', 'network', 'supernet'],
            'protocols': ['tcp', 'udp', 'http', 'dns', 'dhcp', 'snmp', 'ntp', 'syslog'],
            'wan': ['wan', 'frame relay', 'ppp', 'hdlc', 'serial', 'leased line'],
            'ipv6': ['ipv6', 'ipng', 'dual stack', 'tunneling', 'migration'],
            'qos': ['qos', 'quality of service', 'traffic shaping', 'policing', 'marking']
        }
        
        query_lower = query.lower()
        for topic, keywords in topics.items():
            if any(keyword in query_lower for keyword in keywords):
                return topic
        
        return 'general'
    
    def _assess_complexity(self, query: str) -> str:
        """Assess question complexity level"""
        complex_indicators = [
            'design', 'architect', 'implement', 'troubleshoot', 'optimize',
            'compare', 'analyze', 'evaluate', 'integrate', 'configure'
        ]
        
        advanced_terms = [
            'enterprise', 'scalability', 'redundancy', 'convergence',
            'interoperability', 'automation', 'programmability'
        ]
            
        query_lower = query.lower()
        
        if any(term in query_lower for term in advanced_terms):
            return 'advanced'
        elif any(indicator in query_lower for indicator in complex_indicators):
            return 'intermediate'
        else:
            return 'basic'
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive learning statistics"""
        total_questions = sum(t['questions_asked'] for t in self.stats['topic_performance'].values())
        avg_response_time = (self.stats['total_response_time'] / max(1, total_questions))
        
        return {
            'model': self.model,
            'gpu_available': GPU_AVAILABLE,
            'gpu_name': GPU_NAME,
            'questions_answered': total_questions,
            'avg_response_time': f"{avg_response_time:.2f}s",
            'topics_covered': list(self.stats['topic_performance'].keys()),
            'topic_details': self.stats['topic_performance'],
            'student_profile': self.student_profile,
            'complexity_distribution': {
                'basic': len([t for t in self.stats['topic_performance'].values() if t['complexity_level'] == 'basic']),
                'intermediate': len([t for t in self.stats['topic_performance'].values() if t['complexity_level'] == 'intermediate']),
                'advanced': len([t for t in self.stats['topic_performance'].values() if t['complexity_level'] == 'advanced'])
            }
        }
    
    def update_student_profile(self, **kwargs):
        """Update student profile for comprehensive personalization"""
        for key, value in kwargs.items():
            if key in self.student_profile:
                self.student_profile[key] = value
        print(f"📝 Student profile updated: {kwargs}")
    
    def get_personalized_study_plan(self) -> str:
        """Generate comprehensive personalized study recommendations"""
        weak_areas = self.student_profile['weak_areas']
        experience = self.student_profile['experience_level']
        
        plan = f"""🎯 **Comprehensive CCNA Study Plan**

**Your Profile:**
- Experience Level: {experience.title()}
- Learning Style: {self.student_profile['learning_style'].title()}
- Preferred Explanation Style: {self.student_profile['preferred_explanation_style'].title()}

**Recommended Focus Areas:**"""
        
        if weak_areas:
            plan += f"\n- Priority Topics: {', '.join(weak_areas)}"
        else:
            plan += "\n- Complete topic assessment needed"
        
        plan += "\n\n**Comprehensive Study Strategy:**"
        if experience == 'beginner':
            plan += """
1. **Foundation Building** (Weeks 1-4)
   - Network fundamentals and OSI model
   - IP addressing and subnetting mastery
   - Basic CLI navigation and configuration

2. **Core Technologies** (Weeks 5-8)
   - Switching concepts and VLANs
   - Routing fundamentals (static and RIP)
   - Basic security concepts

3. **Advanced Topics** (Weeks 9-12)
   - OSPF and EIGRP implementation
   - Advanced switching (STP, EtherChannel)
   - Network troubleshooting methodologies"""
        elif experience == 'intermediate':
            plan += """
1. **Advanced Routing** (Weeks 1-3)
   - Complex OSPF and EIGRP scenarios
   - BGP fundamentals and implementation
   - Route redistribution and filtering

2. **Enterprise Switching** (Weeks 4-6)
   - Advanced STP configurations
   - HSRP/VRRP implementation
   - Multi-layer switching concepts

3. **Security & Troubleshooting** (Weeks 7-9)
   - Advanced ACL implementations
   - VPN technologies and configuration
   - Complex troubleshooting scenarios"""
        else:
            plan += """
1. **Expert-Level Implementation** (Weeks 1-2)
   - Complex multi-protocol scenarios
   - Advanced troubleshooting with debug tools
   - Performance optimization techniques

2. **Emerging Technologies** (Weeks 3-4)
   - SDN and automation concepts
   - Network programmability basics
   - Cloud integration scenarios

3. **Exam Mastery** (Weeks 5-6)
   - Advanced question pattern analysis
   - Complex scenario-based problems
   - Time management and strategy optimization"""
        
        return plan

if __name__ == "__main__":
    print("🚀 Starting Llama3.1:8B CCNA Tutor...")
    tutor = LlamaCCNATutor()
    
    print("\n" + "="*70)
    print("💡 CCNA AI Tutor - Llama3.1:8B (Comprehensive Mode)")
    print("="*70)
    print("Ask any CCNA-related question for detailed analysis!")
    print("Type 'quit' to exit, 'stats' for performance info, 'plan' for study plan")
    print("="*70 + "\n")
    
    while True:
        try:
            question = input("🎓 Your question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("👋 Happy studying!")
                break
            elif question.lower() == 'stats':
                stats = tutor.get_stats()
                print(f"\n📊 **Comprehensive Performance Stats:**")
                for key, value in stats.items():
                    if key != 'topic_details':
                        print(f"   {key}: {value}")
                print()
                continue
            elif question.lower() == 'plan':
                plan = tutor.get_personalized_study_plan()
                print(f"\n{plan}\n")
                continue
            elif not question:
                continue
            
            print("\n🤖 CCNA Master Expert:")
            answer = tutor.ask_question(question)
            print(answer)
            print("\n" + "-"*70 + "\n")
            
        except KeyboardInterrupt:
            print("\n👋 Happy studying!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
