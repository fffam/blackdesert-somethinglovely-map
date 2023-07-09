<template>
	<span class="skill-level skill-level-{{tier | lowercase}}" data-skill-level="{{level}}"  data-skill-tier="{{tier}}">{{tier}} {{levelWithinTier}}</span>
</template>

<script>

export default {

	name: 'SkillLevel',

	props: {
		level: {
			type: [String,Number],
			default: 0,
			required: true,
			coerce: function (val) {
				return Math.floor(val);
			}
		}
	},

	computed: {

		levelWithinTier: function() {
			if( !this.level ) {
				return 0; // Beginner 0
			} else if( this.level < 51 ) {
				return ((this.level-1)%10)+1; // Beginner 1-Artisan 10
			} else if( this.level < 81 ) {
				return this.level-50; // Master 1-30
			} else {
				return this.level-80; // Guru
			}
		},

		tier: function() {
			var lvl = this.level;
			if( lvl < 11 ) {
				return 'Beginner';
			} else if( lvl < 21 ) {
				return 'Apprentice';
			} else if( lvl < 31 ) {
				return 'Skilled';
			} else if( lvl < 41 ) {
				return 'Professional';
			} else if( lvl < 51 ) {
				return 'Artisan';
			} else if( lvl < 81 ) {
				return 'Master';
			} else {
				return 'Guru';
			}
		}


	}

};
</script>

<style src="./SkillLevel.scss" lang="sass"></style>
