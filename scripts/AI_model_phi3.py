#!/usr/bin/env python3
"""
CCNA AI Tutor - Phi3:Mini Model
Optimized for RTX 3050 with ultra-fast response times (1-2 seconds)
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

class Phi3CCNATutor:
    def __init__(self, model_name: str = "phi3:mini"):
        self.model = model_name
        self.dataset = []
        self.conversation_history = []
        self.student_profile = {
            'learning_style': 'adaptive',
            'experience_level': 'beginner',
            'weak_areas': [],
            'strong_areas': [],
            'exam_date': None,
            'study_goals': [],
            'preferred_explanation_style': 'detailed'
        }
        self.stats = {
            'questions_answered': 0,
            'correct_answers': 0,
            'total_response_time': 0,
            'topic_performance': {},
            'difficulty_progression': [],
            'study_sessions': 0
        }
        
        # Optimized settings for Phi3:Mini - Ultra-fast responses
        self.chat_options = {
            'num_gpu': -1,           # Use all GPU layers
            'num_thread': 6,         # Match CPU cores
            'num_ctx': 1024,         # Smaller context for speed
            'num_predict': 200,      # Limit tokens for faster response
            'temperature': 0.1,      # Low temperature for consistency
            'top_k': 15,             # Focused responses
            'top_p': 0.8,            # Good balance
            'repeat_penalty': 1.1,   # Prevent repetition
            'seed': -1,              # Random seed
            'tfs_z': 1.0,            # Default
            'typical_p': 1.0,        # Default
            'repeat_last_n': 64,     # Prevent repetition
            'penalize_newline': False,
            'numa': False,
            'mirostat': 0,
            'mirostat_tau': 5.0,
            'mirostat_eta': 0.1
        }
        
        print(f"🚀 Phi3:Mini CCNA Tutor initialized")
        print(f"🔧 Model: {self.model}")
        print(f"💻 GPU: {GPU_NAME} ({GPU_MEMORY:.1f}GB)" if GPU_AVAILABLE else "💻 CPU Mode")
        
    def ask_question(self, query: str) -> str:
        """Ask a question with ultra-fast response"""
        start_time = time.time()
        
        try:
            # Build world-class expert system prompt
            system_prompt = self._build_expert_system_prompt()
            
            # Enhanced query for expert-level responses
            enhanced_query = self._build_enhanced_prompt(query)
            
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
            
            # Light enhancement for natural flow
            enhanced_answer = self._enhance_response(answer, query)
            
            # Update analytics
            response_time = time.time() - start_time
            self._update_learning_analytics(query, response_time)
            
            print(f"⚡ Response time: {response_time:.2f}s")
            return enhanced_answer
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return f"I apologize, but I encountered an issue. Please ensure Ollama is running with the {self.model} model loaded."
    
    def chat(self, query: str) -> str:
        """Alias for ask_question for API compatibility"""
        return self.ask_question(query)
    
    def _build_expert_system_prompt(self) -> str:
        """Build natural conversational AI system prompt"""
        experience = self.student_profile['experience_level']
        
        base_prompt = """You are a highly knowledgeable and conversational AI assistant with deep expertise in networking and Cisco technologies. You communicate in a natural, engaging way that feels like talking to a knowledgeable colleague or mentor.

Your communication style:
- Natural, flowing conversation without rigid structure
- Thoughtful explanations that build understanding progressively
- Genuine enthusiasm for helping people learn networking
- Ability to adapt complexity based on the person's background
- Mix of technical precision with relatable explanations
- Conversational transitions that connect ideas smoothly

Your networking knowledge covers:
- Routing protocols, switching technologies, and network security
- Practical troubleshooting and real-world implementation
- Cisco device configuration and best practices
- Network design principles and optimization
- Modern networking trends and technologies

You naturally weave together theory and practice, always aiming to help people truly understand concepts rather than just memorize facts."""
        
        # Experience-based personalization
        if experience == 'beginner':
            base_prompt += """

When helping newcomers to networking, you naturally:
- Use everyday analogies to make complex concepts click
- Build understanding step by step, connecting new ideas to familiar ones
- Share practical examples that show why concepts matter
- Encourage questions and create a comfortable learning environment
- Break down intimidating topics into manageable pieces"""
        elif experience == 'intermediate':
            base_prompt += """

With people who have some networking background, you:
- Connect dots between different concepts they've learned
- Dive deeper into the 'why' behind networking decisions
- Share insights about real-world challenges and solutions
- Help them see patterns and relationships across technologies
- Bridge the gap between theory and practical application"""
        else:
            base_prompt += """

For experienced network professionals, you:
- Engage in technical discussions with appropriate depth
- Explore edge cases and advanced scenarios
- Share insights about enterprise-scale considerations
- Discuss emerging technologies and industry trends
- Provide strategic perspectives on network design and optimization"""
        
        base_prompt += """

Your approach to helping people:
- Explain concepts in a way that builds genuine understanding
- Share practical examples and real-world context naturally
- Adapt your explanations based on what seems to resonate
- Include relevant commands and configurations when helpful
- Anticipate follow-up questions and address them proactively
- Make complex topics feel approachable and interesting

You respond like someone who genuinely enjoys networking and wants to share that enthusiasm while helping others succeed. Your explanations flow naturally and feel conversational rather than formal or robotic."""
        
        return base_prompt
    
    def _build_enhanced_prompt(self, query: str) -> str:
        """Build natural conversational prompt"""
        enhanced_query = f"""Here's a networking question I'd like your help with:

{query}

I'm looking for a thoughtful explanation that helps me really understand this topic. Feel free to include practical examples, relevant commands, or real-world context that would be helpful. If there are common misconceptions or important details people often miss, I'd appreciate you mentioning those too."""
        
        return enhanced_query
    
    def _enhance_response(self, answer: str, query: str) -> str:
        """Enhance response naturally"""
        enhanced_answer = answer.strip()
        
        # Add natural helpful context for specific question types
        if "configure" in query.lower() or "configuration" in query.lower():
            if "verify" not in enhanced_answer.lower() and "show" not in enhanced_answer.lower():
                enhanced_answer += "\n\nBy the way, don't forget to verify your configuration works as expected - the 'show' commands are your best friend for confirming everything is set up correctly."
        
        if "troubleshoot" in query.lower() or "problem" in query.lower():
            if "approach" not in enhanced_answer.lower() and "method" not in enhanced_answer.lower():
                enhanced_answer += "\n\nWhen troubleshooting, I find it helpful to work systematically through the layers - start with the physical connections, then data link, network, and so on. It saves time in the long run."
        
        return enhanced_answer
    
    def _update_learning_analytics(self, query: str, response_time: float):
        """Update student learning analytics"""
        topic = self._extract_topic(query)
        
        if topic not in self.stats['topic_performance']:
            self.stats['topic_performance'][topic] = {
                'questions_asked': 0,
                'avg_response_time': 0,
                'complexity_level': 'basic'
            }
        
        self.stats['topic_performance'][topic]['questions_asked'] += 1
        self.stats['total_response_time'] += response_time
    
    def _extract_topic(self, query: str) -> str:
        """Extract main topic from query"""
        topics = {
            'routing': ['ospf', 'eigrp', 'rip', 'bgp', 'route', 'routing'],
            'switching': ['vlan', 'stp', 'switch', 'trunk', 'etherchannel'],
            'security': ['acl', 'security', 'firewall', 'vpn', '802.1x'],
            'wireless': ['wifi', 'wireless', 'wlan', 'ap', 'controller'],
            'troubleshooting': ['troubleshoot', 'debug', 'problem', 'issue', 'fix'],
            'subnetting': ['subnet', 'vlsm', 'cidr', 'ip address', 'network'],
            'protocols': ['tcp', 'udp', 'http', 'dns', 'dhcp', 'snmp']
        }
        
        query_lower = query.lower()
        for topic, keywords in topics.items():
            if any(keyword in query_lower for keyword in keywords):
                return topic
        
        return 'general'
    
    def get_stats(self) -> Dict[str, Any]:
        """Get learning statistics"""
        avg_response_time = (self.stats['total_response_time'] / 
                           max(1, len([t for t in self.stats['topic_performance'].values() 
                                     if t['questions_asked'] > 0])))
        
        return {
            'model': self.model,
            'gpu_available': GPU_AVAILABLE,
            'gpu_name': GPU_NAME,
            'questions_answered': sum(t['questions_asked'] for t in self.stats['topic_performance'].values()),
            'avg_response_time': f"{avg_response_time:.2f}s",
            'topics_covered': list(self.stats['topic_performance'].keys()),
            'student_profile': self.student_profile
        }
    
    def update_student_profile(self, **kwargs):
        """Update student profile for personalization"""
        for key, value in kwargs.items():
            if key in self.student_profile:
                self.student_profile[key] = value
        print(f"📝 Student profile updated: {kwargs}")

if __name__ == "__main__":
    print("🚀 Starting Phi3:Mini CCNA Tutor...")
    tutor = Phi3CCNATutor()
    
    print("\n" + "="*60)
    print("💡 CCNA AI Tutor - Phi3:Mini (Ultra-Fast Mode)")
    print("="*60)
    print("Ask any CCNA-related question!")
    print("Type 'quit' to exit, 'stats' for performance info")
    print("="*60 + "\n")
    
    while True:
        try:
            question = input("🎓 Your question: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("👋 Happy studying!")
                break
            elif question.lower() == 'stats':
                stats = tutor.get_stats()
                print(f"\n📊 **Performance Stats:**")
                for key, value in stats.items():
                    print(f"   {key}: {value}")
                print()
                continue
            elif not question:
                continue
            
            print("\n🤖 CCNA Expert:")
            answer = tutor.ask_question(question)
            print(answer)
            print("\n" + "-"*60 + "\n")
            
        except KeyboardInterrupt:
            print("\n👋 Happy studying!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
